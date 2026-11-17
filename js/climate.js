/* 大气环流 + 洋流 粒子层
 *
 * 两种对象：
 *  - 风带：纬向风带沿纬圈流动（信风向西、西风带向东），经向分量做成虚线倾角；
 *    季风区为限定经纬盒内的斜向流动，方向随月份反转（西南季风 ⇄ 东北季风）。
 *  - 洋流：沿给定折线路径流动的短划线，暖流偏橙、寒流偏青、季风洋流随季反向。
 *
 * 全部粒子位置逐帧在 CPU 端按「经纬 → 球面」重算，数量控制在千级以内，
 * 以便在纯 file:// 打开、无构建流程的前提下也保持流畅。
 */
(function (global) {
  'use strict';

  var THREE = global.THREE;

  function ll2v(lat, lon, r) {
    var la = lat * Math.PI / 180, lo = (lon + 180) * Math.PI / 180;
    var cl = Math.cos(la);
    return [-r * cl * Math.cos(lo), r * Math.sin(la), r * cl * Math.sin(lo)];
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rad(d) { return d * Math.PI / 180; }

  /* 把 [lon,lat] 折线做成等弧长重采样的球面路径 */
  function makePath(pts, lift, radius, opts) {
    opts = opts || {};
    var dense = [], i, k;
    for (i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      var step = 24;
      for (k = 0; k < step; k++) {
        var t = k / step;
        dense.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    dense.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
    // 平滑三轮，去掉折线拐角的硬角
    for (var pass = 0; pass < 3; pass++) {
      var sm = dense.slice();
      for (k = 1; k < dense.length - 1; k++) {
        sm[k][0] = (dense[k - 1][0] + 2 * dense[k][0] + dense[k + 1][0]) / 4;
        sm[k][1] = (dense[k - 1][1] + 2 * dense[k][1] + dense[k + 1][1]) / 4;
      }
      dense = sm;
    }
    // 等弧长重采样：让粒子匀速前进
    var spacing = opts.spacing || 0.012;
    var out = { lat: [], lon: [], x: [], y: [], z: [], len: 0, spacing: spacing, closed: !!opts.closed };
    var prev = ll2v(dense[0][1], dense[0][0], radius + lift), acc = 0;
    out.lat.push(dense[0][1]); out.lon.push(dense[0][0]);
    out.x.push(prev[0]); out.y.push(prev[1]); out.z.push(prev[2]);
    for (k = 1; k < dense.length; k++) {
      var cur = ll2v(dense[k][1], dense[k][0], radius + lift);
      var dx = cur[0] - prev[0], dy = cur[1] - prev[1], dz = cur[2] - prev[2];
      acc += Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (acc >= spacing) {
        out.lat.push(dense[k][1]); out.lon.push(dense[k][0]);
        out.x.push(cur[0]); out.y.push(cur[1]); out.z.push(cur[2]);
        acc = 0;
      }
      prev = cur;
    }
    out.len = (out.lat.length - 1) * spacing;
    return out;
  }

  function build(radius) {
    var ES = global.EARTH_SYSTEMS;
    if (!ES) throw new Error('EARTH_SYSTEMS 数据未加载');
    if (!THREE) throw new Error('three.js 未加载');

    var CUR_LIFT = 0.010, WIND_LIFT = 0.019;
    var group = new THREE.Group();
    group.name = 'climate';

    var state = {
      month: 6, nh: 0, summer: 0, winter: 0, label: '',
      windOn: true, curOn: true, t: 0
    };

    /* ---------------- 风带 ---------------- */
    var MONSOON_COLOR = new THREE.Color('#eac96b');
    var windParts = [];      // {type:'belt'|'monsoon', ...}
    var beltBands = [], monsoonBands = [];

    ES.winds.forEach(function (w) {
      if (w.type === 'belt') {
        var lanes = w.lanes || 3, perLane = w.perLane || 30;
        for (var li = 0; li < lanes; li++) {
          var lat = w.lat0 + (w.lat1 - w.lat0) * (li + 0.5) / lanes;
          var circle = [];
          for (var lon = -180; lon <= 180; lon += 3) circle.push([lon, lat]);
          var path = makePath(circle, WIND_LIFT, radius, { spacing: 0.018, closed: true });
          var band = { def: w, path: path, laneLat: lat };
          beltBands.push(band);
          for (var p = 0; p < perLane; p++) {
            windParts.push({
              type: 'belt', band: band,
              s: (p + Math.random() * 0.6) / perLane * path.len,
              laneOffset: (Math.random() - 0.5) * Math.min(3.4, (w.lat1 - w.lat0) / lanes * 0.55),
              speed: 0.85 + Math.random() * 0.3,
              phase: Math.random() * Math.PI * 2
            });
          }
        }
      } else if (w.type === 'monsoon') {
        var band2 = { def: w };
        monsoonBands.push(band2);
        var n = w.particles || 54;
        for (var q = 0; q < n; q++) {
          windParts.push({
            type: 'monsoon', band: band2,
            lon: w.lon0 + Math.random() * (w.lon1 - w.lon0),
            lat: w.lat0 + Math.random() * (w.lat1 - w.lat0),
            speed: 0.8 + Math.random() * 0.4,
            jitter: Math.random() * Math.PI * 2
          });
        }
      }
    });

    /* ---------------- 洋流 ---------------- */
    var curParts = [];
    var curPaths = [];
    ES.currents.forEach(function (c) {
      var path = makePath(c.pts, CUR_LIFT, radius, { spacing: 0.012 });
      curPaths.push({ def: c, path: path });
      var n = c.particles || Math.max(14, Math.min(34, Math.round(path.len * 9)));
      for (var i = 0; i < n; i++) {
        curParts.push({
          path: path, def: c,
          s: Math.random() * path.len,
          off: (Math.random() - 0.5) * 0.030,
          speed: 0.85 + Math.random() * 0.3
        });
      }
    });

    /* ---------------- 几何体 ---------------- */
    function makeLines(count, order) {
      var pos = new Float32Array(count * 2 * 3);
      var col = new Float32Array(count * 2 * 3);
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      var mat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      var obj = new THREE.LineSegments(geo, mat);
      obj.renderOrder = order; obj.frustumCulled = false;
      group.add(obj);
      return { obj: obj, pos: pos, col: col, geo: geo };
    }
    var windGeo = makeLines(windParts.length, 7);
    var curGeo = makeLines(curParts.length, 7);

    // 洋流头部小光点
    function dotTexture() {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d');
      var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      var t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
    }
    var curDotPos = new Float32Array(curParts.length * 3);
    var curDotCol = new Float32Array(curParts.length * 3);
    var dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(curDotPos, 3));
    dotGeo.setAttribute('color', new THREE.BufferAttribute(curDotCol, 3));
    var dotMat = new THREE.PointsMaterial({
      size: 0.056, map: dotTexture(), vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    var dotObj = new THREE.Points(dotGeo, dotMat);
    dotObj.renderOrder = 7; dotObj.frustumCulled = false;
    group.add(dotObj);

    var tmpColor = new THREE.Color();
    function setColor(arr, i, hex, mul, tint) {
      tmpColor.set(hex);
      if (tint) { tmpColor.lerp(tint, 0.35); }
      arr[i * 3] = tmpColor.r * mul;
      arr[i * 3 + 1] = tmpColor.g * mul;
      arr[i * 3 + 2] = tmpColor.b * mul;
    }
    // 线段两端分色：尾部压暗形成「彗尾」，方向更易读
    function setSegColor(arr, i, hex, mulHead, mulTail) {
      tmpColor.set(hex);
      var r = tmpColor.r, g = tmpColor.g, b = tmpColor.b;
      arr[i * 6] = r * mulTail; arr[i * 6 + 1] = g * mulTail; arr[i * 6 + 2] = b * mulTail;
      arr[i * 6 + 3] = r * mulHead; arr[i * 6 + 4] = g * mulHead; arr[i * 6 + 5] = b * mulHead;
    }

    // 无分配写入：直接按经纬算球面坐标写进顶点缓冲（每帧上千次，避免数组分配）
    function putLL(arr, base, lat, lon, r) {
      var la = lat * Math.PI / 180, lo = (lon + 180) * Math.PI / 180;
      var cl = Math.cos(la);
      arr[base] = -r * cl * Math.cos(lo);
      arr[base + 1] = r * Math.sin(la);
      arr[base + 2] = r * cl * Math.sin(lo);
    }
    function ll2vInto(out, lat, lon, r) {
      var la = lat * Math.PI / 180, lo = (lon + 180) * Math.PI / 180;
      var cl = Math.cos(la);
      out[0] = -r * cl * Math.cos(lo);
      out[1] = r * Math.sin(la);
      out[2] = r * cl * Math.sin(lo);
    }
    var vHead = [0, 0, 0], vTail = [0, 0, 0];

    /* ---------------- 每帧更新 ---------------- */
    var COLD_TINT = new THREE.Color('#9ad6e8');
    var WARM_TINT = new THREE.Color('#f0b98a');

    function update(dt) {
      state.t += dt;
      var target = ES.seasonIndex(state.month);
      state.nh += (target - state.nh) * Math.min(1, dt * 2.2);
      var mon = ES.monsoonState(state.month);
      state.summer = mon.summer; state.winter = mon.winter; state.label = mon.label;

      var nh = state.nh, t = state.t;

      /* ---- 风带 ---- */
      var wPos = windGeo.pos, wCol = windGeo.col, wi = 0;
      for (var i = 0; i < windParts.length; i++) {
        var p = windParts[i];
        var alpha;
        var latA, lonA, latB, lonB, rW = radius + WIND_LIFT;

        if (p.type === 'belt') {
          var b = p.band, def = b.def;
          // 沿纬圈推进：dir>0 向东，dir<0 向西
          p.s += dt * def.speed * p.speed * b.path.len;
          var u = ((p.s / b.path.len) % 1 + 1) % 1;
          var dashU = 7.0 / 360;
          var u2 = ((u - dashU) % 1 + 1) % 1;
          // 风带随太阳直射点南北摆动：全带以 ±3° 呼吸
          var shift = def.itcz ? nh * 3.6 : nh * 2.2;
          var wob = Math.sin(rad(u * 720) + p.phase) * 0.7;
          latA = b.laneLat + shift + p.laneOffset + wob;
          latB = latA - def.drift * 2.6;
          lonA = def.dir > 0 ? (-180 + u * 360) : (180 - u * 360);
          lonB = def.dir > 0 ? (-180 + u2 * 360) : (180 - u2 * 360);
          alpha = 0.44 + 0.18 * Math.sin(t * 1.4 + p.phase);
          setSegColor(wCol, wi, def.color, alpha, alpha * 0.10);
        } else {
          var d2 = p.band.def;
          var net = state.summer - state.winter;
          var vlon = net * 2.0 * p.speed, vlat = net * (d2.slope || 0.4) * 2.0 * p.speed;
          if (Math.abs(net) < 0.12) {
            vlon = 0.22 * Math.sin(t * 0.7 + p.jitter);
            vlat = 0.22 * Math.cos(t * 0.6 + p.jitter);
          }
          p.lon += vlon * dt / Math.max(0.25, Math.cos(rad(p.lat)));
          p.lat += vlat * dt;
          if (p.lon < d2.lon0 || p.lon > d2.lon1 || p.lat < d2.lat0 || p.lat > d2.lat1) {
            p.lon = d2.lon0 + Math.random() * (d2.lon1 - d2.lon0) * 0.25 +
              (vlon >= 0 ? 0 : (d2.lon1 - d2.lon0) * 0.75);
            p.lat = d2.lat0 + Math.random() * (d2.lat1 - d2.lat0);
          }
          latA = p.lat; lonA = p.lon;
          var dl = 1.4 * p.speed;
          latB = latA - (Math.abs(net) > 0.12 ? Math.sign(net) * (d2.slope || 0.4) * dl : 0);
          lonB = lonA - (Math.abs(net) > 0.12 ? Math.sign(net) * dl : 0.9);
          alpha = 0.20 + 0.42 * Math.abs(net);
          setSegColor(wCol, wi, state.winter > state.summer ? '#7fc4e0' : d2.color, alpha, alpha * 0.10);
        }

        putLL(wPos, wi * 6, latB, lonB, rW);
        putLL(wPos, wi * 6 + 3, latA, lonA, rW);
        wi++;
      }
      windGeo.geo.attributes.position.needsUpdate = true;
      windGeo.geo.attributes.color.needsUpdate = true;

      /* ---- 洋流 ---- */
      var cPos = curGeo.pos, cCol = curGeo.col, ci = 0;
      for (var j = 0; j < curParts.length; j++) {
        var q = curParts[j], pth = q.path, def2 = q.def;
        var dirSign = 1;
        var strength = 1;
        if (def2.kind === 'seasonal') {
          var net2 = state.summer - state.winter;
          dirSign = net2 >= 0 ? 1 : -1;
          strength = 0.25 + 0.75 * Math.abs(net2);
        }
        q.s += dt * (def2.speed || 0.28) * q.speed * strength * dirSign;
        var L = pth.len;
        if (q.s > L) q.s -= L;
        if (q.s < 0) q.s += L;

        var idxF = q.s / pth.spacing;
        var i0 = Math.floor(idxF) % pth.lat.length;
        var i1 = (i0 + 1) % pth.lat.length;
        var f = idxF - Math.floor(idxF);
        var lat0 = pth.lat[i0] + (pth.lat[i1] - pth.lat[i0]) * f;
        var lon0 = pth.lon[i0] + (pth.lon[i1] - pth.lon[i0]) * f;
        // 尾部（逆流方向取一段）
        var back = 0.090 * dirSign;
        var s2 = q.s - back;
        var jf = s2 / pth.spacing;
        var k0 = Math.floor(jf) % pth.lat.length;
        var k1 = (k0 + 1) % pth.lat.length;
        var g = jf - Math.floor(jf);
        var lat2 = pth.lat[k0] + (pth.lat[k1] - pth.lat[k0]) * g;
        var lon2 = pth.lon[k0] + (pth.lon[k1] - pth.lon[k0]) * g;

        var rC = radius + CUR_LIFT;
        ll2vInto(vHead, clamp(lat0, -89, 89), lon0, rC);
        ll2vInto(vTail, clamp(lat2, -89, 89), lon2, rC);
        // 侧向加宽：沿球面法向与切向的叉积做横向错位，让流线成「带」而非单线
        var nx = vHead[0], ny = vHead[1], nz = vHead[2];
        var tx = vHead[0] - vTail[0], ty = vHead[1] - vTail[1], tz = vHead[2] - vTail[2];
        var cx = ny * tz - nz * ty, cy = nz * tx - nx * tz, cz = nx * ty - ny * tx;
        var cl = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1;
        var ox = cx / cl * q.off, oy = cy / cl * q.off, oz = cz / cl * q.off;

        var mul = 0.62 + 0.28 * Math.sin(t * 1.1 + j);
        var baseHex = def2.kind === 'cold' ? '#5cc4d8'
          : (def2.kind === 'warm' ? '#e08a5a' : '#eac96b');
        setSegColor(cCol, ci, baseHex, mul * strength, mul * strength * 0.35);
        cPos[ci * 6] = vTail[0] + ox; cPos[ci * 6 + 1] = vTail[1] + oy; cPos[ci * 6 + 2] = vTail[2] + oz;
        cPos[ci * 6 + 3] = vHead[0] + ox; cPos[ci * 6 + 4] = vHead[1] + oy; cPos[ci * 6 + 5] = vHead[2] + oz;
        ci++;

        curDotPos[j * 3] = vHead[0] + ox;
        curDotPos[j * 3 + 1] = vHead[1] + oy;
        curDotPos[j * 3 + 2] = vHead[2] + oz;
        tmpColor.set(baseHex);
        curDotCol[j * 3] = tmpColor.r * mul * strength * 0.9;
        curDotCol[j * 3 + 1] = tmpColor.g * mul * strength * 0.9;
        curDotCol[j * 3 + 2] = tmpColor.b * mul * strength * 0.9;
      }
      curGeo.geo.attributes.position.needsUpdate = true;
      curGeo.geo.attributes.color.needsUpdate = true;
      dotGeo.attributes.position.needsUpdate = true;
      dotGeo.attributes.color.needsUpdate = true;
    }

    function applyVisibility() {
      windGeo.obj.visible = state.windOn;
      if (!state.curOn) { curGeo.obj.visible = false; dotObj.visible = false; }
      else { curGeo.obj.visible = true; dotObj.visible = true; }
    }
    applyVisibility();

    /* 初始化一次，避免首帧未更新时是空缓冲 */
    update(0.016);

    return {
      group: group,
      setMonth: function (m) { state.month = ((m % 12) + 12) % 12; },
      setWeatherToggles: function (wind, cur) { state.windOn = !!wind; state.curOn = !!cur; applyVisibility(); },
      update: update,
      state: function () {
        return {
          month: state.month + 1, label: state.label,
          summer: +state.summer.toFixed(2), winter: +state.winter.toFixed(2),
          windOn: state.windOn, curOn: state.curOn,
          windParticles: windParts.length, currentParticles: curParts.length,
          currents: ES.currents.map(function (c) { return c.name; })
        };
      }
    };
  }

  global.ClimateLayer = { build: build };
})(window);
