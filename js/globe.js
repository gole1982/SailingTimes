/* 大航海时代 · three.js 地球 / 迷雾揭图 / 多船队并行航线
 * 依赖：three.min.js、data/land.js、data/fog.js、data/expeditions.js、js/fog.js
 * 所有资源本地化，可直接以 file:// 打开。
 *
 * 时间模型：全局「年份」驱动一切。每支探险队有自己的起止年份，
 * 年份落入区间时船在航线上按史料日期插值定位，多队同屏以各自配色区分。
 */
(function (global) {
  'use strict';

  var THREE = global.THREE;
  var R = 2.4;                 // 地球半径
  var LIFT = 0.030;            // 航线离地高度（须大于迷雾壳 R*1.009）
  var MAX_DPR = 2;

  var renderer, scene, camera, earthRoot, starMat, fog, climate, powers, _canvas;
  var framesRendered = 0;
  var routesGroup, routes = [], routeById = {};
  var glowTex, ringTex, pickTargets = [];
  var year = 1405, YEAR_MIN = 1405, YEAR_MAX = 1690;
  var spin = true, rotY = 0, focusId = null, timeAcc = 0, clockLast = 0;
  var viewMode = 'spin';     // 'static' 静止 | 'spin' 自然自转 | 'follow' 跟船
  var showHistory = false;   // 已完成航迹默认隐藏，避免多条历史航线叠成蜘蛛网
  var W = 0, H = 0;
  var cam = { theta: 1.13, phi: 1.36, radius: 7.35, tTheta: 1.13, tPhi: 1.36, tRadius: 7.35 };
  var dragging = false, lastX = 0, lastY = 0;
  var raycaster, pointer = { x: -9999, y: -9999, inside: false, overTag: false };
  var tagHost, hoverCard, pulses = [], pulsesByRoute = {};
  var hidden = {};             // 用户手动隐藏的队伍
  var hoverId = null;

  /* ------------------------------------------------------------------ *
   * 工具
   * ------------------------------------------------------------------ */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function monthOf(y) { return clamp(Math.floor((y - Math.floor(y)) * 12), 0, 11); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 与 SphereGeometry 的 UV 映射一致：u = (lon+180)/360
  function ll2v(lat, lon, r) {
    var la = lat * Math.PI / 180, lo = (lon + 180) * Math.PI / 180;
    var cl = Math.cos(la);
    return new THREE.Vector3(-r * cl * Math.cos(lo), r * Math.sin(la), r * cl * Math.sin(lo));
  }
  function slerp(a, b, t) {
    var d = clamp(a.dot(b), -1, 1), om = Math.acos(d);
    if (om < 1e-6) return a.clone();
    var so = Math.sin(om);
    return a.clone().multiplyScalar(Math.sin((1 - t) * om) / so)
      .addScaledVector(b, Math.sin(t * om) / so);
  }
  // 'YYYY-MM-DD' -> 小数年，供线性插值
  function dateFrac(s) {
    var t = Date.parse(s + 'T00:00:00Z');
    if (!isFinite(t)) return 1405;
    var d = new Date(t), y = d.getUTCFullYear();
    return y + (t - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1));
  }
  function radialGradientTexture(stops, size) {
    var c = document.createElement('canvas'); c.width = c.height = size || 128;
    var g = c.getContext('2d'), h = (size || 128) / 2;
    var gr = g.createRadialGradient(h, h, 0, h, h, h);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    var t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  function unwrapRing(ring) {
    var out = [], off = 0, prev = ring[0][0];
    for (var i = 0; i < ring.length; i++) {
      var lon = ring[i][0], d = lon - prev;
      if (d > 180) off -= 360; else if (d < -180) off += 360;
      out.push([lon + off, ring[i][1]]); prev = lon;
    }
    return out;
  }

  /* ------------------------------------------------------------------ *
   * 地球纹理 + 陆地掩膜（掩膜 row0 = 南极，供迷雾纹理对齐）
   * ------------------------------------------------------------------ */
  function drawLand(g, rings, WID, HEI, mode) {
    [-360, 0, 360].forEach(function (shift) {
      for (var k = 0; k < rings.length; k++) {
        var ring = rings[k]; if (ring.length < 3) continue;
        g.beginPath();
        for (var i = 0; i < ring.length; i++) {
          var px = (ring[i][0] + 180 + shift) / 360 * WID;
          var py = (90 - ring[i][1]) / 180 * HEI;
          if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.closePath();
        if (mode === 'mask') { g.fillStyle = '#fff'; g.fill(); continue; }
        g.fillStyle = 'rgba(24,72,78,0.97)'; g.fill();
        g.lineWidth = 1.5; g.strokeStyle = 'rgba(103,205,201,0.78)'; g.lineJoin = 'round'; g.stroke();
      }
    });
  }

  function makeEarthTexture() {
    // 1536×768 ≈ 4.3 px/度：在默认视距下已足够，且把首屏贴图构建时间压掉近一半
    var WID = 1536, HEI = 768;
    var c = document.createElement('canvas'); c.width = WID; c.height = HEI;
    var g = c.getContext('2d');
    g.lineWidth = 1; g.strokeStyle = 'rgba(96,168,190,0.075)'; g.beginPath();
    for (var lon = -180; lon <= 180; lon += 15) { var x = (lon + 180) / 360 * WID; g.moveTo(x, 0); g.lineTo(x, HEI); }
    for (var lat = -75; lat <= 75; lat += 15) { var y = (90 - lat) / 180 * HEI; g.moveTo(0, y); g.lineTo(WID, y); }
    g.stroke();

    var rings = (global.WORLD_LAND || []).map(unwrapRing);
    // 海岸外辉光
    g.lineWidth = 5; g.strokeStyle = 'rgba(72,183,186,0.10)'; g.lineJoin = 'round';
    [-360, 0, 360].forEach(function (shift) {
      for (var k = 0; k < rings.length; k++) {
        var rg = rings[k]; if (rg.length < 3) continue;
        g.beginPath();
        for (var j = 0; j < rg.length; j++) {
          var qx = (rg[j][0] + 180 + shift) / 360 * WID, qy = (90 - rg[j][1]) / 180 * HEI;
          if (j === 0) g.moveTo(qx, qy); else g.lineTo(qx, qy);
        }
        g.closePath(); g.stroke();
      }
    });
    drawLand(g, rings, WID, HEI, 'color');

    var top = g.createLinearGradient(0, 0, 0, 90);
    top.addColorStop(0, 'rgba(150,205,215,0.18)'); top.addColorStop(1, 'rgba(150,205,215,0)');
    g.fillStyle = top; g.fillRect(0, 0, WID, 90);
    var bot = g.createLinearGradient(0, HEI, 0, HEI - 90);
    bot.addColorStop(0, 'rgba(150,205,215,0.18)'); bot.addColorStop(1, 'rgba(150,205,215,0)');
    g.fillStyle = bot; g.fillRect(0, HEI - 90, WID, 90);

    // 掩膜
    var MW = global.FogAtlas.WIDTH, MH = global.FogAtlas.HEIGHT;
    var mc = document.createElement('canvas'); mc.width = MW; mc.height = MH;
    // 掩膜要做 getImageData 回读：改用 CPU 后端画布，避免每一次回读都同步 GPU
    var mg = mc.getContext('2d', { willReadFrequently: true });
    drawLand(mg, rings, MW, MH, 'mask');
    var md = mg.getImageData(0, 0, MW, MH).data;
    var mask = new Uint8Array(MW * MH);
    for (var row = 0; row < MH; row++) {
      var src = MH - 1 - row; // 掩膜 canvas 顶端是北极；DataTexture row0 是南极
      for (var col = 0; col < MW; col++) mask[row * MW + col] = md[(src * MW + col) * 4 + 3] > 100 ? 1 : 0;
    }

    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
    tex.needsUpdate = true;
    return { tex: tex, mask: mask };
  }

  /* ------------------------------------------------------------------ *
   * 星空 / 经纬线 / 大气
   * ------------------------------------------------------------------ */
  function addStars() {
    var n = 1500, pos = new Float32Array(n * 3), phase = new Float32Array(n), size = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      var rr = 32 + Math.random() * 62, s = Math.sqrt(1 - u * u);
      pos[i * 3] = rr * s * Math.cos(a); pos[i * 3 + 1] = rr * u; pos[i * 3 + 2] = rr * s * Math.sin(a);
      phase[i] = Math.random() * Math.PI * 2; size[i] = 0.9 + Math.pow(Math.random(), 5) * 3.4;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xbcd7e8) } },
      vertexShader: [
        'attribute float aPhase; attribute float aSize; varying float vTw; uniform float uTime;',
        'void main(){ vTw = 0.45 + 0.55*sin(uTime*1.15 + aPhase);',
        ' vec4 mv = modelViewMatrix * vec4(position,1.0);',
        ' gl_PointSize = aSize * (260.0 / max(1.0,-mv.z));',
        ' gl_Position = projectionMatrix * mv; }'
      ].join('\n'),
      fragmentShader: [
        'varying float vTw; uniform vec3 uColor;',
        'void main(){ float d = length(gl_PointCoord - vec2(0.5));',
        ' float a = smoothstep(0.5,0.02,d) * vTw; gl_FragColor = vec4(uColor, a); }'
      ].join('\n'),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(geo, starMat));
  }

  function addGraticule() {
    var pts = [];
    function arc(lat, lonFrom, lonTo, step) {
      for (var lo = lonFrom; lo < lonTo; lo += step) {
        var a = ll2v(lat, lo, R * 1.006), b = ll2v(lat, Math.min(lo + step, lonTo), R * 1.006);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    function meridian(lon) {
      for (var la = -90; la < 90; la += 3) {
        var a = ll2v(la, lon, R * 1.006), b = ll2v(Math.min(la + 3, 90), lon, R * 1.006);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    for (var lo = -180; lo < 180; lo += 30) meridian(lo);
    for (var la = -60; la <= 60; la += 30) arc(la, -180, 180, 3);
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    earthRoot.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color: 0x3f8fa2, transparent: true, opacity: 0.11, depthWrite: false
    })));
    [0, 23.44, -23.44].forEach(function (la2, i) {
      var p = [];
      for (var l = -180; l < 180; l += 2) {
        var a = ll2v(la2, l, R * 1.008), b = ll2v(la2, l + 2, R * 1.008);
        p.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
      var gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      earthRoot.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({
        color: i === 0 ? 0xd8b26a : 0x5aa6a8, transparent: true,
        opacity: i === 0 ? 0.26 : 0.12, depthWrite: false
      })));
    });
  }

  function addAtmosphere() {
    var mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0x3a9fc4) } },
      vertexShader: [
        'varying vec3 vN; varying vec3 vP;',
        'void main(){ vN = normalize(normalMatrix * normal);',
        ' vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz;',
        ' gl_Position = projectionMatrix * mv; }'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vN; varying vec3 vP; uniform vec3 uColor;',
        'void main(){ vec3 v = normalize(-vP);',
        ' float f = pow(1.0 - abs(dot(vN, v)), 3.2);',
        ' gl_FragColor = vec4(uColor, f * 0.48); }'
      ].join('\n'),
      transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending
    });
    earthRoot.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.17, 64, 48), mat));
  }

  /* ------------------------------------------------------------------ *
   * 船舶 / 陆上探险标记
   * ------------------------------------------------------------------ */
  function sailTexture(color) {
    var c = document.createElement('canvas'); c.width = 128; c.height = 128;
    var g = c.getContext('2d');
    g.fillStyle = '#eee2c6'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(140,116,80,0.28)'; g.lineWidth = 1;
    for (var y = 6; y < 128; y += 11) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
    g.strokeStyle = color; g.lineWidth = 9;
    g.beginPath(); g.moveTo(64, 10); g.lineTo(64, 118); g.moveTo(16, 58); g.lineTo(112, 58); g.stroke();
    var t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  function makeSail(w, h, bulge, color) {
    var geo = new THREE.PlaneGeometry(w, h, 6, 4), p = geo.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i);
      var fx = 1 - Math.pow(x / (w / 2), 2), fy = 1 - Math.pow(y / (h / 2), 2);
      p.setZ(i, bulge * Math.max(0, fx) * Math.max(0, fy));
    }
    p.needsUpdate = true; geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      map: sailTexture(color), side: THREE.DoubleSide, transparent: true, opacity: 0.96,
      emissive: 0x2a2418, emissiveIntensity: 0.35
    }));
  }
  function buildShip(hex) {
    var g = new THREE.Group();
    var wood = new THREE.MeshLambertMaterial({ color: 0x6b4429 });
    var woodLight = new THREE.MeshLambertMaterial({ color: 0x8d6337 });
    var dark = new THREE.MeshLambertMaterial({ color: 0x3c291a });
    var s = new THREE.Shape();
    s.moveTo(0, 0.098);
    s.bezierCurveTo(0.024, 0.075, 0.036, 0.020, 0.034, -0.020);
    s.lineTo(0.027, -0.058); s.lineTo(-0.027, -0.058); s.lineTo(-0.034, -0.020);
    s.bezierCurveTo(-0.036, 0.020, -0.024, 0.075, 0, 0.098);
    var hullGeo = new THREE.ExtrudeGeometry(s, { depth: 0.030, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 1, curveSegments: 8 });
    hullGeo.rotateX(Math.PI / 2);
    var hull = new THREE.Mesh(hullGeo, wood); hull.position.y = 0.008; g.add(hull);
    var deck = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.005, 0.115), woodLight);
    deck.position.set(0, 0.011, 0.005); g.add(deck);
    var castle = new THREE.Mesh(new THREE.BoxGeometry(0.047, 0.022, 0.028), wood);
    castle.position.set(0, 0.022, -0.042); g.add(castle);
    var castleTop = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.004, 0.032), woodLight);
    castleTop.position.set(0, 0.035, -0.042); g.add(castleTop);
    [{ z: 0.052, h: 0.105, sw: 0.052, sh: 0.038, sy: 0.062 },
     { z: 0.000, h: 0.155, sw: 0.076, sh: 0.058, sy: 0.093 },
     { z: -0.038, h: 0.112, sw: 0.050, sh: 0.040, sy: 0.070 }].forEach(function (m) {
      var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0042, m.h, 7), dark);
      mast.position.set(0, m.h / 2 + 0.012, m.z); g.add(mast);
      var yard = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, m.sw * 1.25, 6), dark);
      yard.rotation.z = Math.PI / 2; yard.position.set(0, m.sy + m.sh / 2, m.z); g.add(yard);
      var sail = makeSail(m.sw, m.sh, 0.014, hex);
      sail.position.set(0, m.sy, m.z + 0.004); g.add(sail);
    });
    var flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0); flagShape.lineTo(0.030, 0.008); flagShape.lineTo(0, 0.016);
    var flag = new THREE.Mesh(new THREE.ShapeGeometry(flagShape), new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide }));
    flag.position.set(0.003, 0.163, 0); g.add(flag);
    var bow = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.003, 0.055, 6), dark);
    bow.rotation.x = Math.PI / 2 - 0.35; bow.position.set(0, 0.035, 0.105); g.add(bow);
    g.scale.setScalar(1.25);
    return g;
  }
  function buildLandMarker(hex) {
    var g = new THREE.Group();
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.044, 0.010, 18),
      new THREE.MeshLambertMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.32 }));
    g.add(base);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0034, 0.108, 6),
      new THREE.MeshLambertMaterial({ color: 0xd8c49a }));
    pole.position.y = 0.059; g.add(pole);
    var fs = new THREE.Shape();
    fs.moveTo(0, 0); fs.lineTo(0.040, 0.010); fs.lineTo(0, 0.022);
    var flag = new THREE.Mesh(new THREE.ShapeGeometry(fs),
      new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide }));
    flag.position.set(0.003, 0.088, 0); g.add(flag);
    var tent = new THREE.Mesh(new THREE.ConeGeometry(0.021, 0.034, 6),
      new THREE.MeshLambertMaterial({ color: 0x9a7042 }));
    tent.position.set(0.026, 0.016, -0.020); g.add(tent);
    g.scale.setScalar(1.35);
    return g;
  }

  /* ------------------------------------------------------------------ *
   * 航线几何
   * ------------------------------------------------------------------ */
  function buildTube(points, taus, radius, radial) {
    var N = points.length, stride = radial + 1;
    var pos = new Float32Array(N * stride * 3), uv = new Float32Array(N * stride * 2), idx = [];
    var up = new THREE.Vector3(0, 1, 0), alt = new THREE.Vector3(1, 0, 0), prevN = null;
    for (var i = 0; i < N; i++) {
      var p = points[i], a = points[Math.max(0, i - 1)], b = points[Math.min(N - 1, i + 1)];
      var tan = b.clone().sub(a).normalize(), nrm;
      if (prevN) {
        nrm = prevN.clone().addScaledVector(tan, -prevN.dot(tan));
        if (nrm.lengthSq() < 1e-8) nrm = new THREE.Vector3().crossVectors(tan, up);
        nrm.normalize();
      } else nrm = new THREE.Vector3().crossVectors(tan, Math.abs(tan.y) > 0.9 ? alt : up).normalize();
      var bin = new THREE.Vector3().crossVectors(tan, nrm).normalize();
      prevN = nrm.clone();
      for (var j = 0; j <= radial; j++) {
        var ang = j / radial * Math.PI * 2;
        var off = nrm.clone().multiplyScalar(Math.cos(ang) * radius).addScaledVector(bin, Math.sin(ang) * radius);
        var k = i * stride + j;
        pos[k * 3] = p.x + off.x; pos[k * 3 + 1] = p.y + off.y; pos[k * 3 + 2] = p.z + off.z;
        uv[k * 2] = taus[i]; uv[k * 2 + 1] = j / radial;
        if (i < N - 1 && j < radial) { var k2 = k + stride; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  }
  function tubeMaterial(hex) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 }, uColor: { value: new THREE.Color(hex) }, uOpacity: { value: 0.95 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
      ].join('\n'),
      fragmentShader: [
        'uniform float uProgress; uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;',
        'void main(){ if (vUv.x > uProgress) discard;',
        ' float head = uProgress - vUv.x; float glow = exp(-head * 30.0);',
        ' vec3 c = mix(uColor, vec3(1.0,0.96,0.84), glow * 0.72);',
        ' gl_FragColor = vec4(c, uOpacity * (0.55 + 0.45 * glow)); }'
      ].join('\n'),
      transparent: true, depthWrite: false, side: THREE.DoubleSide
    });
  }

  // 展开史实航段：中间可插入纯几何绕行点；curveTaus 存归一化年份（非动画权重）
  function buildCurve(exp, t0, t1) {
    var pts = exp.points, detours = exp.detours || {};
    var unit = pts.map(function (p) { return ll2v(p.lat, p.lon, 1).normalize(); });
    var dates = pts.map(function (p) { return dateFrac(p.date); });
    // 保证日期严格递增（数据里存在只记年份的点，月份为示意）
    for (var q = 1; q < dates.length; q++) if (dates[q] <= dates[q - 1]) dates[q] = dates[q - 1] + 0.008;

    var segNodes = [];
    for (var s = 0; s < unit.length - 1; s++) {
      var arr = [unit[s]], d = detours[s] || [];
      for (var di = 0; di < d.length; di++) arr.push(ll2v(d[di][0], d[di][1], 1).normalize());
      arr.push(unit[s + 1]); segNodes.push(arr);
    }
    var curvePts = [], curveTaus = [];
    for (var si = 0; si < segNodes.length; si++) {
      var nodes = segNodes[si], angles = [], total = 0;
      for (var k = 0; k < nodes.length - 1; k++) {
        var a0 = Math.acos(clamp(nodes[k].dot(nodes[k + 1]), -1, 1));
        angles.push(a0); total += a0;
      }
      if (total < 1e-9) total = 1;
      var fracBefore = 0, d0 = dates[si], d1 = dates[si + 1];
      for (var k2 = 0; k2 < nodes.length - 1; k2++) {
        var w = angles[k2] / total;
        var sd0 = d0 + (d1 - d0) * fracBefore, sd1 = d0 + (d1 - d0) * (fracBefore + w);
        var n2 = Math.max(8, Math.ceil(angles[k2] * 40));
        for (var j = (si === 0 && k2 === 0 ? 0 : 1); j <= n2; j++) {
          var t = j / n2;
          var pos = slerp(nodes[k2], nodes[k2 + 1], t);
          pos.multiplyScalar(R + LIFT + 0.026 * Math.sin(Math.PI * t));
          curvePts.push(pos);
          curveTaus.push(clamp((sd0 + (sd1 - sd0) * t - t0) / (t1 - t0), 0, 1));
        }
        fracBefore += w;
      }
    }
    curveTaus[curveTaus.length - 1] = 1;
    for (var z = 1; z < curveTaus.length; z++) if (curveTaus[z] < curveTaus[z - 1]) curveTaus[z] = curveTaus[z - 1];
    return { pts: curvePts, taus: curveTaus, dates: dates };
  }

  function cardHTML(exp, seg) {
    var gains = (exp.gains || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var dis = (exp.disputes || [])[0];
    var src = (exp.sources || []).slice(0, 2).map(function (x) {
      return '<a href="' + esc(x[1]) + '" target="_blank" rel="noopener noreferrer">↗ ' + esc(x[0]) + '</a>';
    }).join('');
    return '<div class="hc-head"><span class="hc-bar" style="background:' + esc(exp.color) + '"></span>' +
      '<b>' + esc(exp.shortName || exp.name) + '</b><small>' + esc(exp.polity || '') + '</small></div>' +
      '<div class="hc-meta">' + esc(exp.span) + ' · ' + esc(exp.chapter || '') + '</div>' +
      '<div class="hc-sec">此行任务</div><div class="hc-txt">' + esc(exp.mission || exp.tagline || '') + '</div>' +
      (seg ? '<div class="hc-sec">当前航段</div><div class="hc-txt"><em>' + esc(seg.name) + '</em> — ' +
        esc(seg.title || '') + (seg.desc ? '<br>' + esc(seg.desc) : '') + '</div>' : '') +
      (gains ? '<div class="hc-sec">探险成果</div><ul class="hc-list">' + gains + '</ul>' : '') +
      (dis ? '<div class="hc-caveat">※ ' + esc(dis) + '</div>' : '') +
      (src ? '<div class="hc-src">' + src + '</div>' : '');
  }

  function buildRoute(exp) {
    var group = new THREE.Group();
    routesGroup.add(group);
    var t0 = dateFrac(exp.points[0].date), t1 = dateFrac(exp.points[exp.points.length - 1].date);
    if (t1 - t0 < 0.05) t1 = t0 + 0.05;
    var cv = buildCurve(exp, t0, t1);
    var r = {
      exp: exp, group: group, t0: t0, t1: t1, dates: cv.dates,
      curvePts: cv.pts, curveTaus: cv.taus,
      stopTaus: cv.dates.map(function (d) { return clamp((d - t0) / (t1 - t0), 0, 1); }),
      stopPositions: [], markers: [], mode: 'pending', labelEls: [], fired: [], segIdx: 0
    };

    // 未航行段：暗虚线
    var ghostGeo = new THREE.BufferGeometry().setFromPoints(cv.pts);
    var ghostMat = new THREE.LineDashedMaterial({
      color: new THREE.Color(exp.color), dashSize: 0.026, gapSize: 0.026,
      transparent: true, opacity: 0.22, depthWrite: false
    });
    var ghost = new THREE.Line(ghostGeo, ghostMat);
    ghost.computeLineDistances(); ghost.renderOrder = 3; group.add(ghost); r.ghost = ghost;

    // 已完成段：一条自发光管道（renderOrder 必须大于迷雾壳，否则会被雾覆盖）
    r.tubeMat = tubeMaterial(exp.color);
    var tube = new THREE.Mesh(buildTube(cv.pts, cv.taus, exp.type === 'land' ? 0.0085 : 0.0102, 5), r.tubeMat);
    tube.renderOrder = 4; group.add(tube);

    // 第二个外层柔光管道（仅海洋队，避免陆地队过于抢眼）
    if (exp.type !== 'land') {
      var haloMat = tubeMaterial(exp.color);
      haloMat.uniforms.uOpacity.value = 0.13;
      haloMat.blending = THREE.AdditiveBlending;
      var halo = new THREE.Mesh(buildTube(cv.pts, cv.taus, 0.027, 5), haloMat);
      halo.renderOrder = 4; group.add(halo);
      r.haloMat = haloMat;
    }

    // 航点光点与脉冲环
    for (var i = 0; i < exp.points.length; i++) {
      var p = exp.points[i];
      var lp = ll2v(p.lat, p.lon, R + LIFT + 0.005);
      r.stopPositions.push(lp);
      var isKey = p.kind === 'discovery' || p.kind === 'death' || p.kind === 'start' || p.kind === 'end';
      var spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: new THREE.Color(exp.color), transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.30
      }));
      spr.position.copy(lp); spr.scale.setScalar(isKey ? 0.070 : 0.042);
      spr.renderOrder = 5; group.add(spr);
      var ring = new THREE.Sprite(new THREE.SpriteMaterial({
        map: ringTex, color: new THREE.Color(exp.color), transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0
      }));
      ring.position.copy(lp); ring.scale.setScalar(0.10);
      ring.renderOrder = 5; group.add(ring);
      r.markers.push({ sprite: spr, ring: ring, base: isKey ? 0.070 : 0.042, key: isKey, tau: r.stopTaus[i] });
      r.fired.push(false);

      var el = document.createElement('div');
      el.className = 'lab' + (isKey ? ' key' : '');
      el.innerHTML = '<span style="color:' + esc(exp.color) + '">●</span> ' + esc(p.name) +
        '<span class="sm">' + esc(exp.shortName || exp.name) + ' · ' + esc(p.label) + '</span>';
      document.getElementById('labels').appendChild(el);
      r.labelEls.push(el);
    }

    // 船 / 陆上旗标
    r.ship = exp.type === 'land' ? buildLandMarker(exp.color) : buildShip(exp.color);
    group.add(r.ship);
    r.shipGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: new THREE.Color(exp.color), transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5
    }));
    r.shipGlow.scale.setScalar(0.26); r.shipGlow.renderOrder = 5; group.add(r.shipGlow);

    // 不可见拾取球（Raycaster 用）
    var pick = new THREE.Mesh(new THREE.SphereGeometry(0.092, 8, 6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    pick.userData.expId = exp.id;
    group.add(pick); r.pick = pick; pickTargets.push(pick);

    // 屏幕船舶图标 + 悬停卡片
    var tag = document.createElement('div');
    tag.className = 'shiptag';
    tag.dataset.id = exp.id;
    tag.style.setProperty('--c', exp.color);
    var ico = exp.type === 'land'
      ? '<path d="M5 2v20M5 3h13l-3 5 3 5H5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'
      : '<path d="M12 3v17M12 4l8 13h-8M4 17h16l-3 4H7z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>';
    tag.innerHTML = '<span class="st-ico"><svg viewBox="0 0 24 24">' + ico + '</svg></span>' +
      '<span class="st-txt"><b>' + esc(exp.shortName || exp.name) + '</b><small class="st-sub"></small></span>' +
      '<div class="hcard">' + cardHTML(exp, null) + '</div>';
    tagHost.appendChild(tag);
    r.tagEl = tag;
    r.cardEl = tag.querySelector('.hcard');
    r.subEl = tag.querySelector('.st-sub');
    tag.addEventListener('mouseenter', function () {
      pointer.overTag = true; setHover(exp.id);
      if (Globe.onTagHover) Globe.onTagHover(exp.id);
    });
    tag.addEventListener('mouseleave', function () { pointer.overTag = false; setHover(null); });

    group.visible = false;
    return r;
  }

  /* ------------------------------------------------------------------ *
   * 年份驱动
   * ------------------------------------------------------------------ */
  function sampleAt(r, p) {
    var taus = r.curveTaus, lo = 0, hi = taus.length - 1;
    if (p < 1) {
      while (lo < hi - 1) { var mid = (lo + hi) >> 1; if (taus[mid] <= p) lo = mid; else hi = mid; }
    } else lo = taus.length - 1;
    var a = lo, b = Math.min(a + 1, taus.length - 1);
    var span = taus[b] - taus[a];
    var t = span > 1e-9 ? clamp((p - taus[a]) / span, 0, 1) : 0;
    var pos = r.curvePts[a].clone().lerp(r.curvePts[b], t);
    var tan = r.curvePts[Math.min(b + 1, r.curvePts.length - 1)].clone()
      .sub(r.curvePts[Math.max(a - 1, 0)]).normalize();
    return { pos: pos, tan: tan };
  }

  function positionShip(r, prog, dt) {
    var s = sampleAt(r, prog);
    var up = s.pos.clone().normalize();
    var fwd = s.tan.clone().addScaledVector(up, -s.tan.dot(up)).normalize();
    var right = new THREE.Vector3().crossVectors(up, fwd).normalize();
    fwd = new THREE.Vector3().crossVectors(right, up).normalize();
    var m = new THREE.Matrix4().makeBasis(right, up, fwd);
    r.ship.quaternion.setFromRotationMatrix(m);
    if (r.exp.type !== 'land') {
      r.ship.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1), Math.sin(timeAcc * 1.9 + r.t0) * 0.055));
    }
    r.ship.position.copy(s.pos).addScaledVector(up, 0.020);
    r.shipGlow.position.copy(r.ship.position);
    r.pick.position.copy(r.ship.position);
  }

  function currentSeg(r) {
    var idx = 0;
    for (var i = 0; i < r.stopTaus.length; i++) if (year + 1e-6 >= r.dates[i]) idx = i;
    return idx;
  }

  function setYear(y, dt) {
    year = clamp(y, YEAR_MIN, YEAR_MAX);
    if (fog) fog.setYear(year);
    if (powers) powers.setYear(year);
    if (climate) climate.setMonth(monthOf(year));
    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      var off = hidden[r.exp.id];
      if (year < r.exp.a0 || off) { r.mode = 'pending'; r.group.visible = false; r.tagEl.classList.remove('show'); continue; }
      var prog = clamp((year - r.t0) / (r.t1 - r.t0), 0, 1);
      var done = year > r.exp.a1;
      r.mode = done ? 'done' : 'active';
      // 已完成的航迹默认收起，画面只保留「当前年份在场」的队伍；
      // 打开「历史航迹」时才以低透明度叠加显示。
      r.group.visible = done ? showHistory : true;
      r.tubeMat.uniforms.uProgress.value = prog;
      r.tubeMat.uniforms.uOpacity.value = done ? 0.24 : 0.95;
      if (r.haloMat) { r.haloMat.uniforms.uProgress.value = prog; r.haloMat.uniforms.uOpacity.value = done ? 0.015 : 0.13; }
      r.ghost.material.opacity = done ? 0.0 : 0.22;
      r.ship.visible = !done;
      r.shipGlow.visible = !done;
      r.pick.visible = !done;
      if (!done) positionShip(r, prog, dt || 0);

      for (var k = 0; k < r.markers.length; k++) {
        var mk = r.markers[k], reached = year >= r.dates[k];
        mk.sprite.material.opacity = done ? 0.22 : (reached ? (mk.key ? 0.95 : 0.70) : 0.22);
        mk.sprite.scale.setScalar(mk.base * (!done && reached && Math.abs(prog - mk.tau) < 0.02 ? 1.6 : 1));
        if (reached && !r.fired[k] && !done) {
          r.fired[k] = true;
          pulses.push({ ring: mk.ring, t: 0, key: mk.key });
        }
        if (!reached) r.fired[k] = false;
      }

      if (!done) {
        var si = currentSeg(r), yr = Math.floor(year);
        if (si !== r.segIdx || !r.tagEl.dataset.ready) {
          r.segIdx = si;
          r.tagEl.dataset.ready = '1';
          r.cardEl.innerHTML = cardHTML(r.exp, r.exp.points[si]);
        }
        if (yr !== r.subYear) {
          r.subYear = yr;
          r.subEl.textContent = yr + ' · ' + (r.exp.points[si].title || r.exp.points[si].name);
        }
      }
    }
    if (Globe.onYear) Globe.onYear(year);
  }

  /* ------------------------------------------------------------------ *
   * 悬停 / 屏幕投影
   * ------------------------------------------------------------------ */
  function setHover(id) {
    if (hoverId === id) return;
    hoverId = id;
    if (Globe.onHover) Globe.onHover(id);
  }
  function raycast() {
    if (!pointer.inside || pointer.overTag || !raycaster) { hoverCard.classList.remove('show'); return; }
    var ndc = new THREE.Vector2(pointer.x / W * 2 - 1, -(pointer.y / H * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    var live = pickTargets.filter(function (p) { return p.visible && p.parent && p.parent.visible; });
    var hits = raycaster.intersectObjects(live, false);
    if (hits.length) {
      var id = hits[0].object.userData.expId, r = routeById[id];
      if (r && r.mode === 'active') {
        setHover(id);
        hoverCard.innerHTML = r.cardEl.innerHTML;
        hoverCard.style.left = Math.min(W - 330, pointer.x + 18) + 'px';
        hoverCard.style.top = Math.min(H - 300, pointer.y + 14) + 'px';
        hoverCard.classList.add('show');
        return;
      }
    }
    setHover(null);
    hoverCard.classList.remove('show');
  }

  var labelTaken = [];
  function updateTags() {
    earthRoot.updateMatrixWorld(true);
    labelTaken = [];
    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      if (r.mode !== 'active') {
        r.tagEl.classList.remove('show');
        for (var z = 0; z < r.labelEls.length; z++) r.labelEls[z].classList.remove('show');
        continue;
      }
      var wp = r.ship.position.clone().applyMatrix4(earthRoot.matrixWorld);
      var proj = wp.clone().project(camera);
      if (wp.clone().normalize().dot(camera.position.clone().sub(wp).normalize()) > 0.06 && proj.z < 1) {
        var sx = (proj.x * 0.5 + 0.5) * W, sy = (-proj.y * 0.5 + 0.5) * H;
        r.tagEl.style.left = sx + 'px';
        r.tagEl.style.top = sy + 'px';
        r.tagEl.classList.toggle('flip', sx > W * 0.60);
        r.tagEl.classList.add('show');
        r.tagEl.classList.toggle('focus', focusId === r.exp.id);
        labelTaken.push({ x: sx, y: sy, tag: true });
      } else r.tagEl.classList.remove('show');

      // 地名标签：仅活跃队伍的关键点，按屏幕空间去重，最多 16 个
      for (var k = 0; k < r.labelEls.length; k++) {
        var el = r.labelEls[k], mk = r.markers[k];
        if (!mk.key || year < r.dates[k]) { el.classList.remove('show'); continue; }
        var sp = r.stopPositions[k].clone().applyMatrix4(earthRoot.matrixWorld);
        if (sp.clone().normalize().dot(camera.position.clone().sub(sp).normalize()) <= 0.10) {
          el.classList.remove('show'); continue;
        }
        var pr = sp.clone().project(camera);
        if (pr.z >= 1) { el.classList.remove('show'); continue; }
        var x = (pr.x * 0.5 + 0.5) * W, y = (-pr.y * 0.5 + 0.5) * H - 24;
        var clash = false;
        for (var u = 0; u < labelTaken.length; u++) {
          var q = labelTaken[u];
          if (Math.abs(q.x - x) < (q.tag ? 118 : 104) && Math.abs(q.y - y) < (q.tag ? 30 : 24)) { clash = true; break; }
        }
        if (clash || labelTaken.length > 16) { el.classList.remove('show'); continue; }
        labelTaken.push({ x: x, y: y, tag: false });
        el.style.left = x + 'px'; el.style.top = y + 'px';
        el.classList.add('show');
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * 相机 / 交互
   * ------------------------------------------------------------------ */
  function bindControls(canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.inside = true;
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      cam.tTheta -= dx * 0.005;
      cam.tPhi = clamp(cam.tPhi - dy * 0.005, 0.20, Math.PI - 0.20);
    });
    canvas.addEventListener('pointerleave', function () { pointer.inside = false; });
    function end(e) {
      dragging = false; canvas.style.cursor = 'grab';
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
    }
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault(); cam.tRadius = clamp(cam.tRadius + e.deltaY * 0.0055, 3.9, 13.5);
    }, { passive: false });
    canvas.style.cursor = 'grab';
    window.addEventListener('resize', onResize);
  }
  function updateCamera(dt) {
    if (focusId && routeById[focusId] && routeById[focusId].mode === 'active') {
      var r = routeById[focusId], lp = r.ship.position;
      var azWorld = Math.atan2(lp.x, lp.z) + rotY;
      var dTheta = Math.atan2(Math.sin(azWorld - cam.tTheta), Math.cos(azWorld - cam.tTheta));
      cam.tTheta += dTheta * Math.min(1, dt * 1.8);
      var shipLat = Math.asin(clamp(lp.y / lp.length(), -1, 1));
      cam.tPhi = lerp(cam.tPhi, clamp(Math.PI / 2 - shipLat * 0.62, 0.62, 2.50), Math.min(1, dt * 1.2));
    }
    if (spin && !dragging && !focusId) rotY += dt * 0.045;
    earthRoot.rotation.y = rotY;
    cam.theta = lerp(cam.theta, cam.tTheta, 0.09);
    cam.phi = lerp(cam.phi, cam.tPhi, 0.09);
    cam.radius = lerp(cam.radius, cam.tRadius, 0.09);
    camera.position.set(
      cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta),
      cam.radius * Math.cos(cam.phi),
      cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta)
    );
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
  }
  function onResize() {
    if (!renderer) return;
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  }
  function jumpTo(lat, lon) {
    cam.tTheta = Math.PI / 2 + lon * Math.PI / 180 + rotY;
    cam.theta = cam.tTheta;
    cam.tPhi = clamp(Math.PI / 2 - lat * Math.PI / 180 * 0.62, 0.62, 2.50);
    cam.phi = cam.tPhi;
  }

  /* ------------------------------------------------------------------ *
   * 主循环
   * ------------------------------------------------------------------ */
  function frame(now) {
    requestAnimationFrame(frame);
    framesRendered++;
    var dt = clockLast ? Math.min(0.05, (now - clockLast) / 1000) : 0.016;
    clockLast = now; timeAcc += dt;
    if (Globe.onFrame) Globe.onFrame(dt);

    for (var i = pulses.length - 1; i >= 0; i--) {
      var pu = pulses[i]; pu.t += dt;
      var k = pu.t / 1.15;
      if (k >= 1) { pu.ring.material.opacity = 0; pu.ring.scale.setScalar(0.10); pulses.splice(i, 1); }
      else {
        pu.ring.material.opacity = (1 - k) * (pu.key ? 0.8 : 0.45);
        pu.ring.scale.setScalar(0.09 + k * (pu.key ? 0.38 : 0.24));
      }
    }
    for (var j = 0; j < routes.length; j++) {
      var r = routes[j];
      if (r.mode === 'active') r.shipGlow.material.opacity = 0.40 + 0.16 * Math.sin(timeAcc * 2.2 + j);
    }
    if (starMat) starMat.uniforms.uTime.value = timeAcc;
    if (fog) fog.setTime(timeAcc);
    if (climate) climate.update(dt);

    updateCamera(dt);
    labelTaken = [];
    updateTags();
    raycast();
    renderer.render(scene, camera);
  }

  /* ------------------------------------------------------------------ *
   * 公开 API
   * ------------------------------------------------------------------ */
  var Globe = {
    onFrame: null, onYear: null, onHover: null, onTagHover: null, onMode: null, onStepError: null,

    init: function (canvas) {
      if (!THREE) throw new Error('three.js 未加载');
      if (!global.EXPEDITIONS || !global.EXPEDITIONS.length) throw new Error('探险队数据未加载');
      W = window.innerWidth; H = window.innerHeight;
      tagHost = document.getElementById('shipTags');
      hoverCard = document.getElementById('hoverCard');
      YEAR_MIN = global.ATLAS.yearMin; YEAR_MAX = global.ATLAS.yearMax + 0.999;
      year = YEAR_MIN;
      _canvas = canvas;

      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(MAX_DPR, window.devicePixelRatio || 1));
      renderer.setSize(W, H, false);
      renderer.setClearColor(0x050b14, 1);
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050b14, 0.0055);
      camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 300);
      raycaster = new THREE.Raycaster();

      scene.add(new THREE.AmbientLight(0x69a0bd, 0.85));
      var d1 = new THREE.DirectionalLight(0xffe4bb, 1.10); d1.position.set(5, 3.2, 6); scene.add(d1);
      var d2 = new THREE.DirectionalLight(0x2d6f9c, 0.55); d2.position.set(-5, -2, -5); scene.add(d2);

      earthRoot = new THREE.Group(); scene.add(earthRoot);
      earthRoot.add(new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64),
        new THREE.MeshLambertMaterial({ color: 0x0d2740, emissive: 0x061523 })));

      glowTex = radialGradientTexture([
        [0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,240,200,0.92)'],
        [0.45, 'rgba(255,210,130,0.34)'], [1, 'rgba(255,190,90,0)']
      ], 128);
      ringTex = radialGradientTexture([
        [0, 'rgba(255,255,255,0)'], [0.58, 'rgba(255,255,255,0)'],
        [0.72, 'rgba(255,240,205,0.9)'], [0.86, 'rgba(255,220,150,0.35)'], [1, 'rgba(255,200,110,0)']
      ], 128);
      routesGroup = new THREE.Group(); earthRoot.add(routesGroup);
    },

    /* 分阶段构建：由 app 逐帧调度，让遮罩能显示进度而不是长时间冻结 */
    runSteps: function (onProgress, onDone) {
      var steps = [];
      var mask = null;

      steps.push({
        label: '陆地与海岸线', run: function () {
          var em = makeEarthTexture();
          mask = em.mask;
          earthRoot.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.0035, 96, 64),
            new THREE.MeshBasicMaterial({ map: em.tex, transparent: true, depthWrite: false })));
        }
      });
      steps.push({
        label: '未知世界的迷雾', run: function () {
          fog = global.FogAtlas.build(THREE, mask, R * 1.009);
          fog.mesh.renderOrder = 2;   // 势力范围(1)在下，迷雾(2)盖住未揭图处
          earthRoot.add(fog.mesh);
        }
      });
      steps.push({ label: '经纬网与大气', run: function () { addGraticule(); addAtmosphere(); addStars(); } });
      steps.push({
        label: '列强势力与本土政权', run: function () {
          if (global.PowerLayer) { powers = global.PowerLayer.build(R); earthRoot.add(powers.group); }
        }
      });
      steps.push({
        label: '风带、季风与洋流', run: function () {
          if (global.ClimateLayer) { climate = global.ClimateLayer.build(R); earthRoot.add(climate.group); }
        }
      });

      // 航线分批生成（每批 4 条，避免单帧超长任务，也减少遮罩重绘次数）
      var list = global.EXPEDITIONS, CHUNK = 4;
      for (var c0 = 0; c0 < list.length; c0 += CHUNK) {
        (function (from, to) {
          steps.push({
            label: '航线 ' + Math.min(to, list.length) + '/' + list.length,
            run: function () {
              for (var j = from; j < to && j < list.length; j++) {
                var exp = list[j];
                var r = buildRoute(exp);
                routes.push(r); routeById[exp.id] = r;
              }
            }
          });
        })(c0, c0 + CHUNK);
      }

      steps.push({
        label: '整理海图', run: function () {
          bindControls(_canvas);
          onResize();
          jumpTo(15, -25);
          setYear(YEAR_MIN, 0);
        }
      });

      var k = 0;
      function tickStep() {
        if (k >= steps.length) {
          if (onDone) onDone();
          return;
        }
        var st = steps[k++];
        if (onProgress) onProgress(st.label, k, steps.length);
        try {
          st.run();
        } catch (err) {
          if (Globe.onStepError) Globe.onStepError(st.label, err);
          return;
        }
        global.setTimeout(tickStep, 0);
      }
      global.setTimeout(tickStep, 0);
      return steps.length;
    },

    start: function () { global.requestAnimationFrame(frame); },
    frames: function () { return framesRendered; },

    setYear: setYear,
    getYear: function () { return year; },
    monthOf: monthOf,
    setSpin: function (b) { spin = !!b; },
    setVisible: function (id, on) { hidden[id] = !on; setYear(year, 0); },
    isVisible: function (id) { return !hidden[id]; },
    setFocus: function (id) {
      focusId = id || null;
      if (id) { viewMode = 'follow'; spin = false; }
      else if (viewMode === 'follow') { viewMode = 'spin'; spin = true; }
    },
    // 地球三态：static 静止 / spin 自然自转 / follow 中心化跟船
    setMode: function (m) {
      viewMode = (m === 'static' || m === 'follow') ? m : 'spin';
      if (viewMode === 'spin') { spin = true; focusId = null; }
      else if (viewMode === 'static') { spin = false; focusId = null; }
      else {
        spin = false;
        var r = focusId ? routeById[focusId] : null;
        if (!r || r.mode !== 'active') {
          var act = null;
          for (var i = 0; i < routes.length; i++) if (routes[i].mode === 'active') { act = routes[i]; break; }
          if (act) {
            var lp = act.ship.position;
            focusId = act.exp.id;
            var az = Math.atan2(lp.x, lp.z) + rotY;
            var lat = Math.asin(clamp(lp.y / lp.length(), -1, 1));
            cam.tTheta = az; cam.theta = az;
            cam.tPhi = clamp(Math.PI / 2 - lat * 0.57, 0.62, 2.50); cam.phi = cam.tPhi;
            cam.tRadius = 6.7;
          } else focusId = null;
        }
      }
      if (Globe.onMode) Globe.onMode(viewMode, focusId);
      return { mode: viewMode, focus: focusId };
    },
    getMode: function () { return viewMode; },
    setWeather: function (windOn, curOn) { if (climate) climate.setWeatherToggles(windOn, curOn); },
    setPowers: function (on) { if (powers) powers.setVisible(on); },
    getPowers: function () { return powers ? powers.isVisible() : false; },
    getFocus: function () { return focusId; },
    setFogStrength: function (s) { if (fog) fog.setStrength(s); },
    getFogStrength: function () { return fog ? fog.material.uniforms.uStrength.value : 1; },
    setHistory: function (b) { showHistory = !!b; setYear(year, 0); },
    getHistory: function () { return showHistory; },
    jumpTo: jumpTo,
    // 把相机直接对准某支队伍的船（或尚未启航时的出发港），并进入跟拍
    jumpToShip: function (id) {
      var r = routeById[id]; if (!r) return;
      var lp = r.mode === 'active' ? r.ship.position.clone()
        : ll2v(r.exp.points[0].lat, r.exp.points[0].lon, R);
      var az = Math.atan2(lp.x, lp.z) + rotY;
      cam.tTheta = az; cam.theta = az;
      var lat = Math.asin(clamp(lp.y / lp.length(), -1, 1));
      cam.tPhi = clamp(Math.PI / 2 - lat * 0.62, 0.62, 2.50); cam.phi = cam.tPhi;
      cam.tRadius = 6.7;
      focusId = id; spin = false; viewMode = 'follow';
    },
    knownLandFraction: function () { return fog ? fog.knownLandFraction(year) : 0; },
    // 诊断：单帧气候层（粒子）更新耗时（毫秒）
    benchClimate: function (n) {
      if (!climate) return null;
      var t0 = (global.performance || Date).now();
      for (var i = 0; i < (n || 60); i++) climate.update(0.016);
      return +(((global.performance || Date).now() - t0) / (n || 60)).toFixed(3);
    },
    resetView: function () {
      focusId = null; viewMode = 'spin'; spin = true;
      cam.tTheta = 1.13; cam.tPhi = 1.36; cam.tRadius = 7.35;
    },
    activeRoutes: function () {
      return routes.filter(function (r) { return r.mode === 'active'; }).map(function (r) { return r.exp.id; });
    },
    modeOf: function (id) { return routeById[id] ? routeById[id].mode : 'none'; },
    // 供自动化验证使用
    debug: function () {
      var modes = { pending: 0, active: 0, done: 0 };
      routes.forEach(function (r) { modes[r.mode]++; });
      return {
        year: year, month: monthOf(year) + 1, total: routes.length, modes: modes,
        activeIds: Globe.activeRoutes(),
        visibleTags: document.querySelectorAll('.shiptag.show').length,
        visibleLabels: document.querySelectorAll('.lab.show').length,
        fogYear: fog ? fog.material.uniforms.uYear.value : null,
        knownLand: fog ? +fog.knownLandFraction(year).toFixed(4) : null,
        hoverId: hoverId, history: showHistory, spin: spin,
        viewMode: viewMode, focusId: focusId,
        climate: climate ? climate.state() : null,
        powers: powers ? powers.debug() : null
      };
    }
  };
  global.Globe = Globe;
})(window);
