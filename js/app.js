/* 大航海时代 · 年月轴 / 纲目导航 / 并行船队 / 环流与势力图例 */
(function (global) {
  'use strict';

  var A = global.ATLAS, E = global.EXPEDITIONS, G = global.Globe;
  var META = global.EXPEDITION_META || {};
  var ES = global.EARTH_SYSTEMS, S = global.SPHERES;
  var $ = function (id) { return document.getElementById(id); };
  var byId = {};
  E.forEach(function (e) { byId[e.id] = e; });

  var state = {
    year: A.yearMin, playing: true, speedI: 0,
    fog: true, wind: true, current: true, powers: true, history: false,
    mode: 'spin', focus: null,
    lastIntYear: -1, lastMonth: -1, hover: null
  };
  // 1× = 1 月/秒（记忆中的基准速度）；可按倍率加快
  var SPEEDS = [
    { v: 1 / 12, label: '1 月/秒' },
    { v: 6 / 12, label: '半年/秒' },
    { v: 2, label: '2 年/秒' }
  ];
  var MONTHS = (ES && ES.months) || ['一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var YEAR_END = A.yearMax + 0.999;   // 允许表现末年的各个月份
  function frac(y) { return Math.max(0, Math.min(1, (y - A.yearMin) / (A.yearMax - A.yearMin))); }
  function monthIndex() { return Math.max(0, Math.min(11, Math.floor((state.year - Math.floor(state.year)) * 12))); }
  function eraAt(y) {
    for (var i = 0; i < A.eras.length; i++) if (y >= A.eras[i].from && y <= A.eras[i].to) return A.eras[i];
    return y < A.eras[0].from ? A.eras[0] : A.eras[A.eras.length - 1];
  }
  function activeAt(y) {
    return global.ATLAS_UTIL ? global.ATLAS_UTIL.activeAt(y)
      : E.filter(function (e) { return y >= e.a0 && y <= e.a1; });
  }

  /* ---------------- 卷次导航 ---------------- */
  function buildEras() {
    $('eralist').innerHTML = A.eras.map(function (e, i) {
      return '<button class="era" data-i="' + i + '">' +
        '<span class="no">' + esc(e.no) + ' · ' + esc(e.from) + '—' + esc(e.to) + '</span>' +
        '<span class="nm">' + esc(e.name) + '</span>' +
        '<span class="rg">' + esc(e.ch) + '</span></button>';
    }).join('');
    Array.prototype.forEach.call($('eralist').children, function (b) {
      b.addEventListener('click', function () {
        seek(A.eras[+b.dataset.i].from);
        setPlaying(true);
        toast(A.eras[+b.dataset.i].no + ' · ' + A.eras[+b.dataset.i].name);
      });
    });
  }

  /* ---------------- 史料边界 / 常见误解 ---------------- */
  function buildStaticPanels() {
    $('neverlist').innerHTML = (A.neverRevealed || []).map(function (s) {
      return '<span>' + esc(s) + '</span>';
    }).join('');
    var cv = A.caveats || [], open = false;
    function render() {
      $('corrlist').innerHTML = (open ? cv : cv.slice(0, 3)).map(function (s) {
        return '<p>' + esc(s) + '</p>';
      }).join('');
      $('btnCorr').textContent = open ? '收起' : '展开全部 ' + cv.length + ' 条';
    }
    $('btnCorr').addEventListener('click', function () { open = !open; render(); });
    render();
  }

  /* ---------------- 环流 / 洋流 / 势力图例 ---------------- */
  function buildLegend() {
    if (ES) {
      var kinds = { warm: { c: '#e08a5a', n: '暖流' }, cold: { c: '#5cc4d8', n: '寒流' }, seasonal: { c: '#eac96b', n: '季风洋流' } };
      $('legCur').innerHTML = Object.keys(kinds).map(function (k) {
        var names = ES.currents.filter(function (c) { return c.kind === k; }).map(function (c) { return c.name; });
        return '<div class="lg" title="' + esc(names.join('、')) + '"><i style="background:' + kinds[k].c +
          '"></i><b>' + kinds[k].n + '</b><em>' + names.length + ' 条</em></div>';
      }).join('') +
        '<div class="leg-note" style="margin-top:4px">' +
        esc(ES.note) + '</div>';
    }
    if (S) {
      $('legPol').innerHTML = S.polities.map(function (p) {
        return '<div class="lg"><i class="dot" style="background:' + p.color + '"></i><b>' +
          esc(p.name) + '</b><em data-p="' + p.id + '"></em></div>';
      }).join('');
      $('legNote').textContent = S.note;
    }
  }
  function updateLegend() {
    if (ES) {
      var m = monthIndex();
      var mon = ES.monsoonState(m);
      var nh = ES.seasonIndex(m);
      $('legWind').innerHTML =
        '<b>' + esc(MONTHS[m]) + '</b> · 季风：<b>' + esc(mon.label) + '</b>' +
        '<br>常年风带随太阳直射点整体' + (nh >= 0 ? '北移' : '南移') +
        '约 ' + Math.abs(nh * 3.6).toFixed(1) + '°（' +
        (nh >= 0 ? '北半球夏季' : '北半球冬季') + '）';
    }
    if (S) {
      var counts = S.countsByPolity(Math.floor(state.year));
      Array.prototype.forEach.call($('legPol').querySelectorAll('em[data-p]'), function (el) {
        var n = counts[el.dataset.p] || 0;
        el.textContent = n ? n + ' 处' : '—';
        el.style.color = n ? '' : 'var(--muted2)';
      });
    }
  }

  /* ---------------- 时间轴刻度与存续条 ---------------- */
  function buildTrack() {
    var track = $('track');
    Array.prototype.slice.call(track.querySelectorAll('.spanbar,.chap,.yr-tick')).forEach(function (e) { e.remove(); });
    E.forEach(function (e, i) {
      var d = document.createElement('div');
      d.className = 'spanbar';
      d.dataset.id = e.id;
      d.style.left = (frac(e.t0) * 100) + '%';
      d.style.width = Math.max(0.35, (frac(e.t1) - frac(e.t0)) * 100) + '%';
      d.style.top = (11 + (i % 3) * 3) + 'px';
      d.style.background = e.color;
      d.style.color = e.color;
      d.title = e.name + ' · ' + e.span;
      track.appendChild(d);
    });
    A.chapters.forEach(function (c) {
      if (c.year == null) return;
      var d = document.createElement('div');
      d.className = 'chap' + (c.no % 5 === 1 ? ' major' : '');
      d.style.left = (frac(c.year) * 100) + '%';
      d.title = '第' + c.no + '章 · ' + c.name + '（约 ' + c.year + ' 年）';
      track.appendChild(d);
    });
    [1405, 1450, 1500, 1550, 1600, 1650, 1690].forEach(function (y) {
      var d = document.createElement('div');
      d.className = 'yr-tick'; d.style.left = (frac(y) * 100) + '%'; d.textContent = y;
      track.appendChild(d);
    });
  }
  function updateTrack() {
    var p = (frac(state.year) * 100).toFixed(3) + '%';
    $('trackFill').style.width = p; $('knob').style.left = p;
    Array.prototype.forEach.call($('track').querySelectorAll('.spanbar'), function (d) {
      var e = byId[d.dataset.id];
      d.classList.toggle('live', !!e && state.year >= e.a0 && state.year <= e.a1 && G.isVisible(e.id));
    });
  }

  /* ---------------- 当前航行事件 ---------------- */
  function fleetRow(e, past) {
    var m = META[e.id] || {};
    var sub = [];
    if (m.lead) sub.push('<small class="lead">' + esc(m.lead) + '</small>');
    if (m.goal) sub.push('<small class="goal">目标：' + esc(m.goal) + '</small>');
    if (m.force) sub.push('<small class="force">船队：' + esc(m.force) + '</small>');
    if (!sub.length) sub.push('<small class="lead">' + esc(e.span) + (past ? ' · 已结束' : '') + '</small>');
    return '<div class="fl' + (past ? ' past' : '') + '" data-id="' + esc(e.id) +
      '" style="--c:' + esc(e.color) + '">' +
      '<span class="dot"></span>' +
      '<span class="nm">' + esc(e.shortName || e.name) + sub.join('') + '</span>' +
      (past ? '<span></span>' : '<span class="eye" data-eye="1" title="显示/隐藏该队">◉</span>') + '</div>';
  }
  function buildFleet() {
    var live = activeAt(state.year).filter(function (e) { return G.isVisible(e.id); });
    var past = E.filter(function (e) { return state.year > e.a1; }).slice(-3).reverse();
    $('fleetlist').innerHTML = live.map(function (e) { return fleetRow(e, false); }).join('') +
      (live.length ? '' : '<div class="fleet-empty">此年月无在航记录的探险队。拖动时间轴、选择月份或点击左侧卷次跳转。</div>') +
      (past.length ? '<div class="panel-label" style="margin-top:12px">近期归档</div>' +
        past.map(function (e) { return fleetRow(e, true); }).join('') : '');
    Array.prototype.forEach.call($('fleetlist').querySelectorAll('.fl'), function (row) {
      row.addEventListener('click', function (ev) {
        var id = row.dataset.id;
        if (ev.target.dataset.eye) {
          var on = !G.isVisible(id);
          G.setVisible(id, on);
          refresh(true);
          toast((on ? '显示 ' : '隐藏 ') + (byId[id].shortName || byId[id].name));
          return;
        }
        if (state.focus === id) { setMode('spin'); toast('退出跟船 · 恢复自转'); }
        else {
          G.jumpToShip(id);
          state.focus = id; state.mode = 'follow';
          updateModeUI();
          toast('跟船：' + (byId[id].shortName || byId[id].name));
        }
        refresh(true);
      });
    });
  }

  /* ---------------- 右侧纪事 ---------------- */
  function buildChronicle() {
    var y = Math.floor(state.year), era = eraAt(y);
    var rev = A.fogRegions.filter(function (r) { return Math.abs(r.year - y) <= 1; });
    var chapters = A.chapters.filter(function (c) { return c.year != null && Math.abs(c.year - y) <= 2; });
    var known = G.knownLandFraction();
    var changes = S ? S.changesAt(y).slice(0, 6) : [];
    var mon = ES ? ES.monsoonState(monthIndex()) : null;
    $('chronicle').innerHTML =
      '<div class="kicker">Chronicle · ' + esc(era.ch) + '</div>' +
      '<div class="bigyr">' + y + '</div>' +
      '<div class="eraname">' + esc(era.no) + ' · ' + esc(era.name) + '</div>' +
      '<div class="erach">' + esc(era.from) + '—' + esc(era.to) + '　' + esc(era.note) + '</div>' +
      '<div class="sec-t">已知陆地 / Charted Land</div>' +
      '<div class="fogbar"><i style="width:' + (known * 100).toFixed(1) + '%"></i></div>' +
      '<div class="fogbar-lb"><span>已揭开 ' + (known * 100).toFixed(1) + '%</span><span>其余为迷雾</span></div>' +
      '<div class="sec-t">此年新入图 / Revealed</div>' +
      '<div class="reveal">' + (rev.length ? rev.map(function (r) {
        return '<div class="rv">' + esc(r.name) + '<i>' + esc(r.basis) + '</i></div>';
      }).join('') : '<div class="none">本年无新区域进入地图。迷雾之下仍是未知世界。</div>') + '</div>' +
      (changes.length ? '<div class="sec-t">势力易手 / Powers</div><div class="reveal">' +
        changes.map(function (c) {
          return '<div class="rv" style="--c:' + esc(c.color) + '">' + esc(c.name) +
            '<i style="color:' + esc(c.color) + '">' + esc(c.polity) + '</i></div>';
        }).join('') + '</div>' : '') +
      (mon ? '<div class="sec-t">此月环流 / Winds</div><div class="caveat">' +
        esc(monthName()) + '：<b>' + esc(mon.label) + '</b>。' +
        (mon.summer > mon.winter
          ? '西南季风支撑阿拉伯海—印度西岸的东行段，季风洋流亦随之转向东北。'
          : (mon.winter > mon.summer
            ? '东北季风适合自印度西岸西返，亦是郑和船队出洋的候风窗口。'
            : '季风转换期，风向不稳，帆船多在港候风。')) + '</div>' : '') +
      (chapters.length ? '<div class="sec-t">对应章回 / Chapters</div><div class="chips">' +
        chapters.map(function (c) { return '<span>第' + c.no + '章 · ' + esc(c.name) + '</span>'; }).join('') + '</div>' : '');
  }
  function monthName() { return MONTHS[monthIndex()]; }

  /* ---------------- 刷新 ---------------- */
  function refresh(force) {
    var iy = Math.floor(state.year), mi = monthIndex();
    $('hdYear').textContent = iy;
    $('hdMonthTxt').textContent = monthName();
    $('tlYear').textContent = iy;
    $('tlMonth').textContent = '· ' + monthName();
    var era = eraAt(state.year);
    $('tlEra').textContent = era.no + ' · ' + era.name;
    var live = activeAt(state.year).filter(function (e) { return G.isVisible(e.id); });
    var mon = ES ? ES.monsoonState(mi) : null;
    $('hdStat').textContent = live.length + ' 支探险队同期在航 · 已知陆地 ' +
      (G.knownLandFraction() * 100).toFixed(0) + '%' + (mon ? ' · ' + mon.label : '');
    updateTrack();
    Array.prototype.forEach.call($('eralist').children, function (b, i) {
      b.classList.toggle('on', A.eras[i] === era);
    });
    if (force || mi !== state.lastMonth) {
      state.lastMonth = mi;
      updateLegend();
    }
    if (force || iy !== state.lastIntYear) {
      state.lastIntYear = iy;
      buildFleet(); buildChronicle();
    }
    if (state.hover) {
      Array.prototype.forEach.call($('fleetlist').querySelectorAll('.fl'), function (row) {
        row.style.outline = row.dataset.id === state.hover ? '1px solid rgba(216,178,106,.7)' : '';
      });
    }
  }

  /* ---------------- 播放 / seek ---------------- */
  function setPlaying(b) {
    state.playing = b;
    $('playIcon').setAttribute('d', b ? 'M6 5h4v14H6zm8 0h4v14h-4z' : 'M8 5v14l11-7z');
    $('btnPlay').title = b ? '暂停 (空格)' : '播放 (空格)';
  }
  function seek(y) {
    state.year = Math.max(A.yearMin, Math.min(YEAR_END, y));
    G.setYear(state.year, 0);
    refresh(true);
  }
  function setMonth(m) {
    seek(Math.floor(state.year) + Math.max(0, Math.min(11, m)) / 12 + 0.5 / 12);
    $('selMonth').value = String(m);
  }
  function setMode(m) {
    var r = G.setMode(m) || {};
    state.mode = r.mode || m;
    state.focus = r.focus || null;
    updateModeUI();
    refresh(true);
  }
  function updateModeUI() {
    Array.prototype.forEach.call($('modeSeg').children, function (b) {
      b.classList.toggle('on', b.dataset.mode === state.mode);
    });
  }
  var toastTimer;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  function bind() {
    $('btnPlay').addEventListener('click', function () { setPlaying(!state.playing); });
    $('btnReplay').addEventListener('click', function () {
      seek(A.yearMin); setPlaying(true); G.resetView(); state.focus = null;
      state.mode = 'spin'; updateModeUI(); toast('回到 1405 年');
    });
    $('btnSpeed').addEventListener('click', function () {
      state.speedI = (state.speedI + 1) % SPEEDS.length;
      $('btnSpeed').textContent = SPEEDS[state.speedI].label;
    });
    $('btnFog').addEventListener('click', function () {
      state.fog = !state.fog;
      G.setFogStrength(state.fog ? 1 : 0);
      $('btnFog').classList.toggle('on', state.fog);
      toast(state.fog ? '迷雾：按年份遮盖未知大陆' : '迷雾已关闭（完整地图）');
    });
    $('btnWind').addEventListener('click', function () {
      state.wind = !state.wind;
      G.setWeather(state.wind, state.current);
      $('btnWind').classList.toggle('on', state.wind);
      toast(state.wind ? '季风与风带动画：开' : '风带已隐藏');
    });
    $('btnCurrent').addEventListener('click', function () {
      state.current = !state.current;
      G.setWeather(state.wind, state.current);
      $('btnCurrent').classList.toggle('on', state.current);
      toast(state.current ? '洋流流动：开' : '洋流已隐藏');
    });
    $('btnPowers').addEventListener('click', function () {
      state.powers = !state.powers;
      G.setPowers(state.powers);
      $('btnPowers').classList.toggle('on', state.powers);
      toast(state.powers ? '势力范围：开' : '势力范围已隐藏');
    });
    $('btnHistory').addEventListener('click', function () {
      state.history = !state.history;
      G.setHistory(state.history);
      $('btnHistory').classList.toggle('on', state.history);
      toast(state.history ? '叠加显示已完成航迹' : '只显示当前年份在航的船队');
    });
    $('btnReset').addEventListener('click', function () {
      G.resetView(); state.focus = null; state.mode = 'spin';
      updateModeUI(); refresh(true); toast('视角已复位 · 自转');
    });
    $('modeSeg').addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('button[data-mode]') : null;
      if (!b) return;
      setMode(b.dataset.mode);
      toast(b.dataset.mode === 'static' ? '地球静止 · 可自由拖拽'
        : (b.dataset.mode === 'spin' ? '地球自然自转' : '跟船 · 视角跟随选中船队'));
    });
    $('selMonth').addEventListener('change', function () {
      setMonth(+$('selMonth').value);
      toast(Math.floor(state.year) + ' 年 · ' + monthName());
    });

    var track = $('track');
    function trackSeek(e) {
      var r = track.getBoundingClientRect();
      seek(A.yearMin + (e.clientX - r.left) / r.width * (A.yearMax - A.yearMin));
      $('selMonth').value = String(monthIndex());
    }
    track.addEventListener('pointerdown', function (e) {
      try { track.setPointerCapture(e.pointerId); } catch (err) { /* 合成事件 */ }
      trackSeek(e);
      track._mv = function (ev) { trackSeek(ev); };
      track.addEventListener('pointermove', track._mv);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      track.addEventListener(ev, function () { if (track._mv) track.removeEventListener('pointermove', track._mv); track._mv = null; });
    });

    // 点击船舶图标 -> 跟船
    $('shipTags').addEventListener('click', function (e) {
      var tag = e.target.closest ? e.target.closest('.shiptag') : null;
      if (!tag) return;
      var id = tag.dataset.id;
      if (state.focus === id) { setMode('spin'); toast('退出跟船'); }
      else {
        G.jumpToShip(id); state.focus = id; state.mode = 'follow';
        updateModeUI(); toast('跟船：' + (byId[id].shortName || byId[id].name));
      }
      refresh(true);
    });

    document.addEventListener('keydown', function (e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      var step = e.shiftKey ? 1 : 1 / 12;
      if (e.code === 'Space') { e.preventDefault(); setPlaying(!state.playing); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); seek(state.year + step); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(state.year - step); }
      else if (e.key === 'f' || e.key === 'F') { $('btnFog').click(); }
      else if (e.key === 'w' || e.key === 'W') { $('btnWind').click(); }
      else if (e.key === 'c' || e.key === 'C') { $('btnCurrent').click(); }
      else if (e.key === 'p' || e.key === 'P') { $('btnPowers').click(); }
      else if (e.key === 'g' || e.key === 'G') { $('btnMode' + (state.mode === 'spin' ? 'Static' : 'Spin')).click(); }
      else if (e.key === 'r' || e.key === 'R') { $('btnReplay').click(); }
      else if (/^[1-7]$/.test(e.key)) { $('eralist').children[+e.key - 1].click(); }
    });
  }

  function tick(dt) {
    if (!state.playing) return;
    state.year += dt * SPEEDS[state.speedI].v;
    if (state.year >= YEAR_END) { state.year = YEAR_END; setPlaying(false); toast('1690 年 · 本卷终'); }
    G.setYear(state.year, dt);
    refresh(false);
  }

  function buildMonthSelect() {
    $('selMonth').innerHTML = MONTHS.map(function (m, i) {
      return '<option value="' + i + '">' + esc(m) + '</option>';
    }).join('');
  }

  function boot() {
    var bootEl = $('boot');
    function say(msg) {
      if (bootEl) bootEl.textContent = msg;
      (global.__bootSeen = global.__bootSeen || []).push(msg);
    }
    var missing = [];
    if (!global.THREE) missing.push('vendor/three.min.js');
    if (!global.WORLD_LAND) missing.push('data/land.js');
    if (!global.ATLAS) missing.push('data/fog.js');
    if (!global.EXPEDITIONS) missing.push('data/expeditions.js');
    if (!global.EARTH_SYSTEMS) missing.push('data/earth-systems.js');
    if (!global.SPHERES) missing.push('data/spheres.js');
    if (!global.FogAtlas) missing.push('js/fog.js');
    if (!global.PowerLayer) missing.push('js/powers.js');
    if (!global.ClimateLayer) missing.push('js/climate.js');
    if (missing.length) { say('缺少依赖：' + missing.join('、')); return; }

    try {
      buildStaticPanels(); buildEras(); buildTrack(); buildMonthSelect();
      buildLegend(); bind();
      G.init($('scene'));         // 只做渲染器/场景/相机等轻量外壳
      G.onFrame = tick;
      G.onHover = function (id) { state.hover = id; refresh(false); };
      G.onMode = function (m, id) { state.mode = m; if (id) state.focus = id; updateModeUI(); };
      G.onStepError = function (label, err) {
        say('构建「' + label + '」失败：' + err.message);
        console.error(err);
      };
    } catch (err) {
      say('场景初始化失败：' + err.message);
      console.error(err);
      return;
    }

    // 重活分步做：每一步之间让出主线程，遮罩上的进度才能刷出来
    // 进度文案节流到 ~140 ms，避免每步都重绘整屏（软件渲染下很贵）
    var lastPaint = 0, lastText = '';
    G.runSteps(function (label, i, n) {
      var now = Date.now();
      if (now - lastPaint < 140 && i < n) return;
      lastPaint = now;
      lastText = '正在绘制逐年海图 … ' + Math.round(i / n * 100) + '%　' + label;
      say(lastText);
    }, function () {
      try {
        G.setWeather(state.wind, state.current);
        G.setPowers(state.powers);
        $('btnSpeed').textContent = SPEEDS[0].label;
        setMode('spin');
        seek(A.yearMin);
        $('selMonth').value = String(monthIndex());
        setPlaying(true);
      } catch (err) {
        say('海图整备失败：' + err.message);
        console.error(err);
        return;
      }
      say('正在绘制逐年海图 … 着色器与纹理上屏（首次打开较慢）');
      G.start();
      // 等首帧真正画出来（着色器编译与纹理上屏都在这一帧），再撤遮罩；
      // 后台标签页 rAF 会被节流，用定时器兜底，避免遮罩永远不走
      var done = false;
      function finishBoot() {
        if (done) return;
        done = true;
        if (!bootEl) return;
        bootEl.classList.add('hide');
        setTimeout(function () { if (bootEl.parentNode) bootEl.parentNode.removeChild(bootEl); }, 900);
      }
      (function waitFrame() {
        if (G.frames() > 0) { finishBoot(); return; }
        global.requestAnimationFrame(waitFrame);
      })();
      global.setTimeout(finishBoot, 5000);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
