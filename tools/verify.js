/* Headless Chrome 验证：全局年份轴 / 迷雾揭图 / 多船队并行 / 悬停信息卡
 * 用法: node tools/verify.js [outputDir]
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.dirname(__dirname);
const CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const CHROME = CANDIDATES.find(p => fs.existsSync(p));
const PORT = 9300 + Math.floor(Math.random() * 600);
const OUT = process.argv[2] || path.join(ROOT, '.verify');
const PAGE_URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
const Y0 = 1405, Y1 = 1690;
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, nextId = 1;
const pending = new Map();
const errors = [];
const logs = [];
const checks = [];

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
  return r.result.value;
}
async function waitFor(fn, timeout = 20000, step = 250) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { if (await fn()) return true; } catch (e) { /* retry */ }
    await sleep(step);
  }
  return false;
}
async function screenshot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const p = path.join(OUT, name);
  fs.writeFileSync(p, Buffer.from(r.data, 'base64'));
  console.log('  screenshot ->', path.basename(p));
}
function check(name, ok, detail) {
  checks.push({ name, ok: !!ok, detail });
  console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail) : ''));
}
async function seekYear(y) {
  const f = (y - Y0) / (Y1 - Y0);
  await evaluate(`(function(){
    var t=document.getElementById('track'), r=t.getBoundingClientRect();
    t.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+r.width*${f},clientY:r.top+10,bubbles:true,pointerId:1}));
    t.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1}));
  })()`);
  await sleep(650);
}
async function state() {
  return evaluate(`(function(){
    var d=window.Globe.debug();
    return {
      year:d.year, modes:d.modes, activeIds:d.activeIds,
      visibleTags:d.visibleTags, visibleLabels:d.visibleLabels,
      fogYear:d.fogYear, knownLand:d.knownLand, total:d.total,
      hdYear:document.getElementById('hdYear').textContent,
      hdStat:document.getElementById('hdStat').textContent,
      fleetRows:document.querySelectorAll('#fleetlist .fl').length,
      liveBars:document.querySelectorAll('#track .spanbar.live').length,
      reveals:document.querySelectorAll('#chronicle .rv').length,
      chapters:document.querySelectorAll('#chronicle .chips span').length,
      eraOn:document.querySelectorAll('#eralist .era.on').length,
      fogStrength:window.Globe.getFogStrength(),
      month:d.month, monthTxt:document.getElementById('hdMonthTxt').textContent,
      monthSel:document.getElementById('selMonth').value,
      viewMode:d.viewMode, focusId:d.focusId,
      monsoon:d.climate?d.climate.label:null,
      summer:d.climate?d.climate.summer:null,
      winter:d.climate?d.climate.winter:null,
      windParticles:d.climate?d.climate.windParticles:0,
      currentParticles:d.climate?d.climate.currentParticles:0,
      windOn:d.climate?d.climate.windOn:null,
      curOn:d.climate?d.climate.curOn:null,
      powerRegions:d.powers?d.powers.regions:0,
      powerCounts:d.powers?d.powers.counts:null,
      legPolRows:document.querySelectorAll('#legPol .lg').length,
      legCurRows:document.querySelectorAll('#legCur .lg').length,
      legWind:document.getElementById('legWind').textContent.replace(/\s+/g,' ').slice(0,60)
    };
  })()`);
}

(async () => {
  if (!CHROME) throw new Error('未找到 Chrome/Edge 可执行文件');
  fs.mkdirSync(OUT, { recursive: true });
  const profile = path.join(os.tmpdir(), 'sailing-verify-' + Date.now());
  const args = [
    '--headless=new', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
    '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
    '--window-size=1600,900', '--hide-scrollbars',
    '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'
  ];
  const chrome = spawn(CHROME, args, { stdio: 'ignore', windowsHide: true });
  console.log('browser pid', chrome.pid, '| port', PORT);

  let target;
  await waitFor(async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const list = await res.json();
    target = list.find(t => t.type === 'page');
    return !!target;
  });
  if (!target) throw new Error('no page target');

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve; ws.onerror = reject;
    setTimeout(() => reject(new Error('CDP websocket open timeout')), 12000);
  });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
    } else if (m.method === 'Runtime.exceptionThrown') {
      errors.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    } else if (m.method === 'Log.entryAdded') {
      const e = m.params.entry;
      if (e.level === 'error' || e.level === 'warning') logs.push(e.level + ': ' + e.text + (e.url ? ' @' + e.url : ''));
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      logs.push('console.error: ' + m.params.args.map(a => a.value || a.description).join(' '));
    }
  };

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });

  console.log('\nnavigate ->', PAGE_URL);
  await send('Page.navigate', { url: PAGE_URL });
  // boot 遮罩在 1.2s 后会从 DOM 移除，因此「隐藏」与「已移除」都算启动成功
  const booted = await waitFor(() => evaluate(
    "(function(){var b=document.getElementById('boot'); return !b || b.classList.contains('hide');})()"
  ), 25000);
  await sleep(2200);

  const env = await evaluate(`(function(){
    var c=document.getElementById('scene');
    var gl=c && (c.getContext('webgl2')||c.getContext('webgl'));
    return {
      boot:document.getElementById('boot')?document.getElementById('boot').textContent:'(removed)',
      bootHidden:!!document.getElementById('boot')&&document.getElementById('boot').classList.contains('hide'),
      canvas:c?c.width+'x'+c.height:null,
      webgl:!!gl, version:gl?gl.getParameter(gl.VERSION):null,
      three:!!window.THREE, landRings:window.WORLD_LAND?window.WORLD_LAND.length:null,
      expeditions:window.EXPEDITIONS?window.EXPEDITIONS.length:null,
      landTypes:window.EXPEDITIONS?window.EXPEDITIONS.filter(function(e){return e.type==='land'}).length:null,
      seaTypes:window.EXPEDITIONS?window.EXPEDITIONS.filter(function(e){return e.type==='sea'}).length:null,
      fogRegions:window.ATLAS?window.ATLAS.fogRegions.length:null,
      chapters:window.ATLAS?window.ATLAS.chapters.length:null,
      eras:document.querySelectorAll('#eralist .era').length,
      spanbars:document.querySelectorAll('#track .spanbar').length,
      shiptags:document.querySelectorAll('#shipTags .shiptag').length,
      caveats:document.querySelectorAll('#corrlist p').length,
      neverChips:document.querySelectorAll('#neverlist span').length,
      earthSystems:window.EARTH_SYSTEMS?{winds:window.EARTH_SYSTEMS.winds.length,currents:window.EARTH_SYSTEMS.currents.length}:null,
      sphereRegions:window.SPHERES?window.SPHERES.regions.length:null,
      spherePolities:window.SPHERES?window.SPHERES.polities.length:null,
      metaCount:window.EXPEDITION_META?Object.keys(window.EXPEDITION_META).length:0,
      powerLayer:!!window.PowerLayer, climateLayer:!!window.ClimateLayer,
      monthOptions:document.querySelectorAll('#selMonth option').length,
      modeButtons:document.querySelectorAll('#modeSeg button').length,
      monthLabel:document.getElementById('hdMonthTxt').textContent
    };
  })()`);
  console.log('\n--- environment ---');
  console.log(JSON.stringify(env, null, 2));
  check('启动完成（遮罩已隐藏或移除）', booted && (env.boot === '(removed)' || env.bootHidden), env.boot);
  check('WebGL 渲染可用', env.webgl, env.version);
  check('31 支探险队已加载（含陆地探险）', env.expeditions >= 30 && env.landTypes >= 10, env.landTypes + ' land / ' + env.seaTypes + ' sea');
  check('书 50 章与卷次导航已生成', env.chapters === 50 && env.eras === 7);
  check('船标 DOM 与存续条数量一致', env.shiptags === env.expeditions && env.spanbars === env.expeditions);
  check('迷雾区域与史料边界面板已生成', env.fogRegions >= 50 && env.caveats === 3 && env.neverChips >= 4);
  check('环流/洋流/势力数据已加载', !!env.earthSystems && env.earthSystems.winds >= 8 && env.earthSystems.currents >= 15 &&
    env.sphereRegions >= 55 && env.spherePolities === 7 && env.metaCount >= 30,
    { winds: env.earthSystems && env.earthSystems.winds, currents: env.earthSystems && env.earthSystems.currents,
      regions: env.sphereRegions, polities: env.spherePolities, meta: env.metaCount });
  check('年月选择与地球三态控件就位', env.monthOptions === 12 && env.modeButtons === 3 &&
    env.powerLayer && env.climateLayer && env.monthLabel === '一月',
    { monthOptions: env.monthOptions, mode: env.modeButtons, month: env.monthLabel });

  // 分阶段启动：遮罩必须走完并撤下，且过程中确实输出过进度文案
  const bootSeq = await evaluate(`(function(){
    return { removed: !document.getElementById('boot'),
             seen: (window.__bootSeen || []).length,
             labels: (window.__bootSeen || []).slice(0, 4),
             last: (window.__bootSeen || []).slice(-1)[0] || '' };
  })()`);
  console.log('\n--- boot sequence ---');
  console.log(JSON.stringify(bootSeq, null, 2));
  check('分阶段启动走完并撤掉遮罩', bootSeq.removed && bootSeq.seen >= 5 &&
    /正在绘制逐年海图/.test(bootSeq.labels[0] || '') && /首帧|着色器/.test(bootSeq.last),
    { seen: bootSeq.seen, last: bootSeq.last.slice(0, 40) });

  // 暂停播放，避免年份漂移
  await evaluate(`document.getElementById('btnPlay').click()`);

  const snapshots = {};
  for (const y of [1405, 1445, 1492, 1521, 1542, 1606, 1610, 1642, 1690]) {
    await seekYear(y);
    snapshots[y] = await state();
    const s = snapshots[y];
    console.log('\n--- year ' + y + ' ---');
    console.log(JSON.stringify(s, null, 2));
    check(y + ' 年份轴与迷雾 uniform 同步', Math.abs(s.year - y) < 1.2 && Math.abs(s.fogYear - s.year) < 0.01,
      { year: +s.year.toFixed(2), fogYear: +(s.fogYear || 0).toFixed(2) });
    check(y + ' 图例/存续条/卷次高亮同步', s.liveBars === s.modes.active && s.eraOn === 1 && s.fleetRows >= (s.modes.active ? 1 : 0),
      { liveBars: s.liveBars, active: s.modes.active, fleetRows: s.fleetRows, eraOn: s.eraOn });
    if (y === 1521 || y === 1542 || y === 1610) {
      check(y + ' 同期多船队并行 ≥3', s.modes.active >= 3, s.activeIds);
    }
    if (y === 1521 || y === 1610) await screenshot('0' + (y === 1521 ? 3 : 4) + '-year-' + y + '.png');
    if (y === 1405) await screenshot('01-year-1405.png');
    if (y === 1492) await screenshot('02-year-1492.png');
    if (y === 1690) await screenshot('05-year-1690.png');
    if (y === 1405 || y === 1521 || y === 1690) {
      check(y + ' 环流粒子层就绪', s.windParticles > 250 && s.currentParticles > 100 && s.month === 1,
        { wind: s.windParticles, currents: s.currentParticles, month: s.month, label: s.monsoon });
      check(y + ' 势力范围图层有内容', s.powerRegions > 8 && s.legPolRows === 7 && s.legCurRows === 3,
        { regions: s.powerRegions, polities: s.legPolRows, currents: s.legCurRows });
    }
  }

  const known = [1405, 1445, 1492, 1521, 1606, 1690].map(y => snapshots[y].knownLand);
  console.log('\n--- known-land fraction progression ---');
  console.log(known.map((v, i) => [1405, 1445, 1492, 1521, 1606, 1690][i] + ':' + (v * 100).toFixed(1) + '%').join('  '));
  check('已知陆地比例随年份单调递增', known.every((v, i) => i === 0 || v >= known[i - 1] - 1e-6), known);
  check('1690 年仍有大片陆地为迷雾', known[known.length - 1] < 0.82, +(known[known.length - 1] * 100).toFixed(1) + '%');

  // 势力范围随时间扩张（欧洲五国据点/殖民地数量）
  const eu = y => ['pt', 'es', 'gb', 'fr', 'nl']
    .reduce((s, k) => s + ((snapshots[y].powerCounts || {})[k] || 0), 0);
  console.log('\n--- european presence ---');
  [1405, 1521, 1542, 1610, 1690].forEach(y => console.log('  ' + y + ': ' + eu(y) + ' 处'));
  check('欧洲势力范围随年份扩张', eu(1405) === 0 && eu(1521) >= 4 && eu(1690) > eu(1521),
    { y1405: eu(1405), y1521: eu(1521), y1690: eu(1690) });
  check('原住民/本土政权始终在列', (snapshots[1405].powerCounts.il || 0) >= 8 && (snapshots[1690].powerCounts.il || 0) >= 6,
    { y1405: snapshots[1405].powerCounts.il, y1690: snapshots[1690].powerCounts.il });

  // 季风随月份反向（切换后等两帧，让气候层与图例同步）
  const monsoon = await evaluate(`(async function(){
    function wait(n){return new Promise(function(r){var i=0;(function step(){ if(++i>=n) return r(); requestAnimationFrame(step);})();});}
    var sel=document.getElementById('selMonth'), out=[];
    for (var m of [0,6]) {
      sel.value=String(m);
      sel.dispatchEvent(new Event('change',{bubbles:true}));
      await wait(4);
      var d=window.Globe.debug();
      out.push({month:d.month, label:d.climate.label, summer:d.climate.summer, winter:d.climate.winter,
                monthTxt:document.getElementById('hdMonthTxt').textContent,
                selVal:sel.value, stat:document.getElementById('hdStat').textContent});
    }
    return out;
  })()`);
  console.log('\n--- monsoon by month ---');
  console.log(JSON.stringify(monsoon, null, 2));
  check('一月为东北季风、七月为西南季风',
    monsoon[0].winter > monsoon[0].summer && /东北季风/.test(monsoon[0].label) && monsoon[0].month === 1 &&
    monsoon[1].summer > monsoon[1].winter && /西南季风/.test(monsoon[1].label) && monsoon[1].month === 7,
    monsoon.map(m => m.month + '月 ' + m.label));
  check('月份选择器与页头月份一致',
    monsoon[0].selVal === '0' && monsoon[0].monthTxt === '一月' &&
    monsoon[1].selVal === '6' && monsoon[1].monthTxt === '七月',
    monsoon.map(m => m.monthTxt));
  await sleep(400);
  await screenshot('07-monsoon-july.png');

  // 地球三态（选一年有在航船队的年份）
  await seekYear(1521);
  const modes = await evaluate(`(function(){
    var b={};
    document.getElementById('btnModeStatic').click();
    b.staticMode=window.Globe.getMode(); b.staticSpin=window.Globe.debug().spin;
    document.getElementById('btnModeSpin').click();
    b.spinMode=window.Globe.getMode(); b.spinSpin=window.Globe.debug().spin;
    document.getElementById('btnModeFollow').click();
    var d=window.Globe.debug();
    b.followMode=d.viewMode; b.followSpin=d.spin; b.followFocus=d.focusId;
    b.segOn=document.querySelectorAll('#modeSeg button.on').length;
    b.segLabel=document.querySelector('#modeSeg button.on').textContent;
    return b;
  })()`);
  console.log('\n--- globe modes ---');
  console.log(JSON.stringify(modes));
  check('地球三态：静止不自转 / 自转 / 跟船中心化',
    modes.staticMode === 'static' && modes.staticSpin === false &&
    modes.spinMode === 'spin' && modes.spinSpin === true &&
    modes.followMode === 'follow' && modes.followSpin === false && !!modes.followFocus &&
    modes.segOn === 1, modes);
  await sleep(500);
  await screenshot('08-follow-ship.png');

  // 图层开关
  const layers = await evaluate(`(function(){
    var out={};
    document.getElementById('btnWind').click(); out.windOff=window.Globe.debug().climate.windOn;
    document.getElementById('btnWind').click(); out.windOn=window.Globe.debug().climate.windOn;
    document.getElementById('btnCurrent').click(); out.curOff=window.Globe.debug().climate.curOn;
    document.getElementById('btnCurrent').click(); out.curOn=window.Globe.debug().climate.curOn;
    document.getElementById('btnPowers').click(); out.powOff=window.Globe.getPowers();
    document.getElementById('btnPowers').click(); out.powOn=window.Globe.getPowers();
    out.listText=(document.querySelector('#fleetlist .fl:not(.past)')||{textContent:''}).textContent.replace(/\\s+/g,' ');
    return out;
  })()`);
  console.log('\n--- layers ---');
  console.log(JSON.stringify(layers));
  check('季风 / 洋流 / 势力三个图层可独立开关',
    layers.windOff === false && layers.windOn === true &&
    layers.curOff === false && layers.curOn === true &&
    layers.powOff === false && layers.powOn === true, layers);
  check('事件列表含人物 / 目标 / 船队', /目标：/.test(layers.listText) && /船队：/.test(layers.listText),
    layers.listText.slice(0, 120));

  // 标签屏幕重叠检测
  await seekYear(1542);
  const overlap = await evaluate(`(function(){
    var els=[].slice.call(document.querySelectorAll('#labels .lab.show'))
      .concat([].slice.call(document.querySelectorAll('#shipTags .shiptag.show')));
    var b=els.map(function(e){var r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});
    var n=0;
    for(var i=0;i<b.length;i++)for(var j=i+1;j<b.length;j++)
      if(Math.abs(b[i].x-b[j].x)<Math.min(b[i].w,b[j].w)*0.85 && Math.abs(b[i].y-b[j].y)<Math.min(b[i].h,b[j].h)*0.9) n++;
    return { count:b.length, overlaps:n, labels:document.querySelectorAll('#labels .lab.show').length,
             tags:document.querySelectorAll('#shipTags .shiptag.show').length };
  })()`);
  console.log('\n--- label / ship-tag overlap ---');
  console.log(JSON.stringify(overlap));
  check('可见标签无显著重叠', overlap.overlaps === 0, overlap);

  // 悬停信息卡：用真实鼠标事件触发 CSS :hover
  const tag = await evaluate(`(function(){
    var e=document.querySelector('#shipTags .shiptag.show');
    if(!e) return null; var r=e.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2,id:e.dataset.id};
  })()`);
  if (tag) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tag.x, y: tag.y });
    await sleep(500);
    const hov = await evaluate(`(function(){
      var t=document.querySelector('#shipTags .shiptag:hover');
      var c=t?t.querySelector('.hcard'):null;
      var hc=document.getElementById('hoverCard');
      return {
        hovered:!!t, id:t?t.dataset.id:null,
        display:c?getComputedStyle(c).display:'none',
        hasMission:c?/此行任务/.test(c.textContent):false,
        hasSegment:c?/当前航段/.test(c.textContent):false,
        hasGains:c?/探险成果/.test(c.textContent):false,
        hasCaveat:c?/※/.test(c.textContent):false,
        cardText:c?c.textContent.replace(/\\s+/g,' ').slice(0,150):'',
        raycastCard:hc.classList.contains('show'),
        hoverId:window.Globe.debug().hoverId
      };
    })()`);
    console.log('\n--- hover card ---');
    console.log(JSON.stringify(hov, null, 2));
    check('悬停船舶显示任务/当前航段/成果', hov.hovered && hov.display !== 'none' && hov.hasMission && hov.hasSegment && hov.hasGains,
      { id: hov.id, display: hov.display });
    await screenshot('06-hover-card.png');
  } else check('存在可见船舶图标供悬停', false, null);

  // 迷雾开关 / 速度 / 历史航迹 / 聚焦 / 卷次跳转
  const toggles = await evaluate(`(function(){
    document.getElementById('btnFog').click();
    var off=window.Globe.getFogStrength();
    document.getElementById('btnFog').click();
    var on=window.Globe.getFogStrength();
    document.getElementById('btnSpeed').click();
    var sp=document.getElementById('btnSpeed').textContent;
    document.getElementById('btnHistory').click();
    var histOn=window.Globe.getHistory();
    document.getElementById('btnHistory').click();
    var histOff=window.Globe.getHistory();
    var d=window.Globe.debug();
    var row=document.querySelector('#fleetlist .fl:not(.past)');
    var rowId=row?row.dataset.id:null;
    if(row) row.click();
    var focus=window.Globe.getFocus();
    var modeAfter=window.Globe.getMode();
    if(row) row.click();
    var modeBack=window.Globe.getMode();
    document.querySelectorAll('#eralist .era')[4].click();
    return { fogOff:off, fogOn:on, speed:sp, histOn:histOn, histOff:histOff,
             spinDefault:d.spin, rowId:rowId, focus:focus, modeAfter:modeAfter, modeBack:modeBack,
             yearAfterEra:+document.getElementById('hdYear').textContent };
  })()`);
  console.log('\n--- controls ---');
  console.log(JSON.stringify(toggles));
  check('迷雾开关与速度按钮生效', toggles.fogOff === 0 && toggles.fogOn === 1 && /月\/秒|年\/秒/.test(toggles.speed),
    toggles.speed);
  check('历史航迹开关生效且默认关闭', toggles.histOn === true && toggles.histOff === false);
  check('点击事件行跟船、再点返回自转', toggles.focus === toggles.rowId &&
    toggles.modeAfter === 'follow' && toggles.modeBack === 'spin',
    { focus: toggles.focus, row: toggles.rowId, after: toggles.modeAfter, back: toggles.modeBack });
  check('点击卷次跳转到对应年份', Math.abs(toggles.yearAfterEra - 1513) < 2, toggles.yearAfterEra);

  console.log('\n--- runtime errors (' + errors.length + ') ---');
  errors.forEach(e => console.log(e.slice(0, 600)));
  console.log('--- console/log warnings (' + logs.length + ') ---');
  logs.slice(0, 25).forEach(e => console.log(e.slice(0, 400)));
  check('零运行时异常', errors.length === 0, errors.length);
  check('零控制台错误', logs.filter(l => /^console\.error|^error:/.test(l)).length === 0,
    logs.filter(l => /^console\.error|^error:/.test(l)).length);

  const failed = checks.filter(c => !c.ok);
  console.log('\n=== RESULT: ' + (checks.length - failed.length) + '/' + checks.length + ' checks passed ===');
  if (failed.length) console.log('FAILED: ' + failed.map(c => c.name).join(' | '));

  ws.close();
  chrome.kill();
  process.exit(failed.length || errors.length ? 1 : 0);
})().catch(e => {
  console.error('VERIFY FAILED:', e);
  if (ws) try { ws.close(); } catch (x) { }
  process.exit(2);
});
