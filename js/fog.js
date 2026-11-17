/* 「已知世界」迷雾层
 *
 * 把 data/fog.js 的区域揭图年份编码进一张 DataTexture 的 R 通道，
 * GPU 端只用 uYear 一个 uniform 比较即可逐年揭开，无需每帧回传纹理。
 *   R = (revealYear - 1400) * 0.85，>=250 表示「始终未发现」
 *   G = 是否陆地（陆地浓雾、海洋薄雾）
 *   B = 多尺度平滑噪声（打散区域边界、驱动雾体翻涌）
 *   A = 雾缘柔化权重（到永久迷雾的距离；0=清晰，1=浓雾）
 * DataTexture 的 flipY 默认为 false，故 row 0 对应 uv.v=0，即南纬 90°。
 *
 * 区域边界用「噪声扰动过的圆角矩形距离场」判定，揉成云絮状而非矩形拼贴。
 * 边界柔化按【空间距离】固定在 A 通道，不随年份推进向外退雾——
 * 于是内陆、南极、太平洋深处等未发现之地在整个时段内始终保持迷雾。
 */
(function (global) {
  'use strict';

  var WID = 1024, HEI = 512;
  var YEAR0 = 1400, SCALE = 0.85, UNKNOWN = 255;

  // 整数 hash，避免逐像素 Math.sin 造成初始化卡顿
  function hash(x, y) {
    var n = (x * 374761393 + y * 668265263) | 0;
    n = ((n ^ (n >>> 13)) * 1274126177) | 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function valueNoise(x, y, freq) {
    var fx = x * freq, fy = y * freq;
    var xi = Math.floor(fx), yi = Math.floor(fy);
    var tx = fx - xi, ty = fy - yi;
    var sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return lerp(
      lerp(hash(xi, yi), hash(xi + 1, yi), sx),
      lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), sx),
      sy
    );
  }

  function build(THREE, landMask, radius) {
    if (!global.ATLAS) throw new Error('ATLAS 数据未加载');
    if (!landMask || landMask.length !== WID * HEI) {
      throw new Error('陆地掩膜尺寸应为 ' + WID + '×' + HEI + '，实际 ' + (landMask ? landMask.length : 0));
    }

    var data = new Uint8Array(WID * HEI * 4);
    var coded = new Uint8Array(WID * HEI);
    var nField = new Float32Array(WID * HEI);
    coded.fill(UNKNOWN);

    // 多尺度平滑噪声：低频决定雾缘大轮廓，中频打碎直线，高频做细碎斑驳
    for (var y0n = 0; y0n < HEI; y0n++) {
      for (var x0n = 0; x0n < WID; x0n++) {
        nField[y0n * WID + x0n] =
          0.40 * valueNoise(x0n, y0n, 1 / 78) +
          0.31 * valueNoise(x0n, y0n, 1 / 27) +
          0.21 * valueNoise(x0n, y0n, 1 / 9) +
          0.08 * hash(x0n, y0n);
      }
    }

    // 边界扰动场：低频定大轮廓、中频碎边、高频做细碎斑驳。
    // 直接叠加到区域归一化距离上，矩形边被揉成云絮状；逐像素查表，不拖慢初始化。
    var wob = new Float32Array(WID * HEI);
    for (var wy = 0; wy < HEI; wy++) {
      for (var wx3 = 0; wx3 < WID; wx3++) {
        wob[wy * WID + wx3] =
          0.44 * (valueNoise(wx3, wy, 1 / 96) - 0.5) +
          0.26 * (valueNoise(wx3, wy, 1 / 34) - 0.5) +
          0.12 * (valueNoise(wx3, wy, 1 / 13) - 0.5);
      }
    }

    // 稳定排序保证「年份升序、同年保持书写顺序」——后写的细分区域覆盖大区域，
    // 正好表达「海岸先于内陆」，也避免数据里的排列顺序影响揭图结果。
    var ordered = global.ATLAS.fogRegions.map(function (r, i) { return { r: r, i: i }; })
      .sort(function (a, b) { return (a.r.year - b.r.year) || (a.i - b.i); })
      .map(function (x) { return x.r; });

    var INNER = 0.94;

    ordered.forEach(function (r) {
      var lon0 = r.box[0], lat0 = r.box[1], lon1 = r.box[2], lat1 = r.box[3];
      var x0 = Math.max(0, Math.floor((lon0 + 180) / 360 * WID));
      var x1 = Math.min(WID, Math.ceil((lon1 + 180) / 360 * WID));
      var y0 = Math.max(0, Math.floor((lat0 + 90) / 180 * HEI));
      var y1 = Math.min(HEI, Math.ceil((lat1 + 90) / 180 * HEI));
      var c = Math.max(0, Math.min(249, Math.round((r.year - YEAR0) * SCALE)));
      var base = r.year <= 1400;
      var amp = base ? 2 : 12;      // 区域内边缘推后揭图的年数（编码单位）
      var jitter = base ? 3 : 8;    // 噪声造成的年份起伏
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      var rx = Math.max(1, (x1 - x0) / 2), ry = Math.max(1, (y1 - y0) / 2);
      // 外扩以容纳负噪声扰动把边界推出的部分（最大扰动约 0.41）
      var padX = Math.max(18, Math.round((x1 - x0) * 0.24));
      var padY = Math.max(18, Math.round((y1 - y0) * 0.24));
      var xa0 = Math.max(0, x0 - padX), xb0 = Math.min(WID, x1 + padX);
      var ya0 = Math.max(0, y0 - padY), yb0 = Math.min(HEI, y1 + padY);
      // 扁长区域（如亚马孙河道带）ry 很小，归一化扰动会被按比例缩小而留下直线边界；
      // 按最小半轴补一项像素级扰动，让细长条的上下缘同样揉成波浪。
      var fineScale = 7 / Math.max(4, Math.min(rx, ry));

      for (var y = ya0; y < yb0; y++) {
        var row = y * WID, ay = Math.abs(y + 0.5 - cy) / ry;
        for (var x = xa0; x < xb0; x++) {
          var i = row + x;
          var ax = Math.abs(x + 0.5 - cx) / rx;
          // p≈4 超椭圆近似：贴合矩形但角落圆润，再叠加噪声扰动
          var d = Math.max(ax, ay) + 0.18 * Math.min(ax, ay) + wob[i]
            + (nField[i] - 0.5) * 2 * fineScale;
          if (d > INNER) continue;
          var edge = Math.max(0, Math.min(1, (d - 0.42) / 0.58));
          var cc = c + Math.round(edge * amp + (nField[i] - 0.5) * jitter * 2);
          coded[i] = cc < 0 ? 0 : (cc > 249 ? 249 : cc);
        }
      }
    });

    // 二、雾缘柔化场：从「永久迷雾」像素向内做有限距离传播。
    //    只有真正邻接未知区的边界才被加雾，区域彼此相接处不会裂出雾缝；
    //    宽度固定，因此揭示范围严格等于史实区域，不会随年份自动外扩。
    var SOFT_R = 22, decay = 1 / SOFT_R;
    var soft = new Float32Array(WID * HEI), softTmp = new Float32Array(WID * HEI);
    for (var s0 = 0; s0 < WID * HEI; s0++) {
      if (coded[s0] === UNKNOWN) soft[s0] = 1;
    }
    for (var pass = 0; pass < SOFT_R; pass++) {
      softTmp.set(soft);
      for (var sy = 1; sy < HEI - 1; sy++) {
        var sr = sy * WID;
        for (var sx = 1; sx < WID - 1; sx++) {
          var si = sr + sx;
          if (coded[si] === UNKNOWN) continue;
          var best = soft[si - 1];
          if (soft[si + 1] > best) best = soft[si + 1];
          if (soft[si - WID] > best) best = soft[si - WID];
          if (soft[si + WID] > best) best = soft[si + WID];
          var v = best - decay;
          if (v > soft[si]) softTmp[si] = v;
        }
      }
      var sw = soft; soft = softTmp; softTmp = sw;
    }

    for (var y2 = 0; y2 < HEI; y2++) {
      for (var x2 = 0; x2 < WID; x2++) {
        var i = y2 * WID + x2, o = i * 4;
        data[o] = coded[i];
        data[o + 1] = landMask[i] ? 255 : 0;
        data[o + 2] = Math.round(Math.max(0, Math.min(1, nField[i])) * 255);
        // A 通道存雾缘柔化权重（纹理 alpha 本身不参与最终透明度）
        data[o + 3] = Math.round(Math.max(0, Math.min(1, soft[i])) * 255);
      }
    }

    // 陆地像素的揭图年份直方图，供 UI 显示「已知世界比例」
    var hist = new Int32Array(360), landTotal = 0;
    for (var k = 0; k < WID * HEI; k++) {
      if (!landMask[k]) continue;
      landTotal++;
      if (coded[k] < 250) hist[Math.round(YEAR0 + coded[k] / SCALE) - YEAR0]++;
    }

    var tex = new THREE.DataTexture(data, WID, HEI, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.needsUpdate = true;

    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: tex },
        uYear: { value: YEAR0 },
        uTime: { value: 0 },
        uStrength: { value: 1.0 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main(){ vUv = uv;',
        ' gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uMap; uniform float uYear; uniform float uTime; uniform float uStrength;',
        'varying vec2 vUv;',
        'void main(){',
        '  vec4 t = texture2D(uMap, vUv);',
        '  float c = t.r * 255.0;',
        '  float unknown = step(250.0, c);',
        '  float n = t.b * 2.0 - 1.0;',
        '  float soft = t.a;',
        '  float land = t.g;',
        // CPU 端已把年份场打碎，这里只补一点小幅起伏
        '  float ry = 1400.0 + c / 0.85 + n * 6.0;',
        // 窗口前移：区域在标称年份即基本揭开，前沿落在之前 12 年；
        // 1405 年的旧大陆因而清晰，不会再出现年份量化造成的水平色带
        '  float revealed = smoothstep(ry - 12.0, ry + 2.0, uYear) * (1.0 - soft * 0.86);',
        '  float fog = max(1.0 - revealed, unknown) * uStrength;',
        '  if (fog < 0.012) discard;',
        '  float maxA = mix(0.30, 0.955, land);',
        // 低频流动雾体（不用高频 sin，避免网点/摩尔纹）
        '  float w1 = sin(vUv.x * 39.0 + uTime * 0.23 + n * 9.0) * cos(vUv.y * 31.0 - uTime * 0.16);',
        '  float w2 = sin(vUv.x * 71.0 - uTime * 0.13 + n * 5.0) * cos(vUv.y * 59.0 + uTime * 0.19);',
        '  float swirl = 0.5 + 0.28 * w1 + 0.14 * w2;',
        '  vec3 base = mix(vec3(0.052,0.080,0.108), vec3(0.086,0.099,0.116), land);',
        '  vec3 col = base + vec3(0.038,0.040,0.038) * (swirl - 0.5);',
        '  float frontier = (1.0 - abs(revealed * 2.0 - 1.0)) * (1.0 - unknown);',
        '  col += vec3(0.80,0.60,0.31) * frontier * 0.28;',
        '  gl_FragColor = vec4(col, min(1.0, fog * maxA + frontier * 0.20));',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide
    });

    var mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), mat);
    // 陆地/经纬网(0) 之后、航线(3~5) 之前绘制
    mesh.renderOrder = 1;

    var cumulative = new Float32Array(360), acc = 0;
    for (var q = 0; q < 360; q++) { acc += hist[q]; cumulative[q] = landTotal ? acc / landTotal : 0; }

    return {
      mesh: mesh,
      material: mat,
      setYear: function (y) { mat.uniforms.uYear.value = y; },
      setTime: function (t) { mat.uniforms.uTime.value = t; },
      setStrength: function (s) { mat.uniforms.uStrength.value = s; },
      knownLandFraction: function (y) {
        var j = Math.max(0, Math.min(359, Math.round(y - YEAR0)));
        return cumulative[j];
      },
      regionsAt: function (y) {
        return global.ATLAS.fogRegions.filter(function (r) { return Math.abs(r.year - y) <= 1; });
      }
    };
  }

  global.FogAtlas = { build: build, WIDTH: WID, HEIGHT: HEI };
})(window);
