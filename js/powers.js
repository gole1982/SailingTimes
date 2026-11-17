/* 势力范围图层（逐年）
 *
 * 把 data/spheres.js 的区域在该年「是否存续」绘成一张等经纬贴图：
 *  - 连片色块按陆地掩膜裁剪，避免色块漫到海里；
 *  - 原住民区用斜线填充（hatch），与欧洲殖民区的实色区分；
 *  - 商站/要塞画成不受裁剪的圆点，表达「据点而非领土」。
 * 贴图只在跨年时重绘，年份推进不会每帧回传纹理。
 */
(function (global) {
  'use strict';

  var THREE = global.THREE;

  var W = 1024, H = 512;
  function px(lon) { return (lon + 180) / 360 * W; }
  function py(lat) { return (90 - lat) / 180 * H; }

  /* 确定性噪声：把矩形色块的直边揉成手绘般的近似边界 */
  function hash2(x, y) {
    var n = (x * 374761393 + y * 668265263) | 0;
    n = ((n ^ (n >>> 13)) * 1274126177) | 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  function noise2(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), tx = x - xi, ty = y - yi;
    var sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    var a = hash2(xi, yi) * (1 - sx) + hash2(xi + 1, yi) * sx;
    var b = hash2(xi, yi + 1) * (1 - sx) + hash2(xi + 1, yi + 1) * sx;
    return a * (1 - sy) + b * sy;
  }
  function warpRing(ring, seed) {
    var lo = 999, hi = -999, la = 999, ha = -999;
    ring.forEach(function (p) {
      lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]);
      la = Math.min(la, p[1]); ha = Math.max(ha, p[1]);
    });
    var span = Math.min(hi - lo, ha - la);
    var amp = Math.max(0.4, Math.min(5.2, span * 0.30));
    var out = [];
    for (var i = 0; i < ring.length; i++) {
      var a = ring[i], b = ring[(i + 1) % ring.length];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len;
      var segs = Math.max(2, Math.min(10, Math.round(len / 3)));
      for (var k = 0; k < segs; k++) {
        var t = k / segs;
        var lon = a[0] + dx * t, lat = a[1] + dy * t;
        var d = (noise2(lon * 0.5 + seed, lat * 0.5 + seed) - 0.5) * 1.5
          + (noise2(lon * 0.17 + seed * 2.3, lat * 0.17 - seed) - 0.5) * 1.6;
        out.push([lon + nx * d * amp, lat + ny * d * amp]);
      }
    }
    return out;
  }

  function build(radius) {
    var S = global.SPHERES;
    if (!S) throw new Error('SPHERES 数据未加载');
    if (!THREE) throw new Error('three.js 未加载');

    /* ---- 陆地掩膜（一次性） ---- */
    var mcv = document.createElement('canvas'); mcv.width = W; mcv.height = H;
    var mg = mcv.getContext('2d');
    mg.fillStyle = '#fff';
    (global.WORLD_LAND || []).forEach(function (ring) {
      if (!ring || ring.length < 3) return;
      [-360, 0, 360].forEach(function (shift) {
        mg.beginPath();
        for (var i = 0; i < ring.length; i++) {
          var x = px(ring[i][0] + shift), y = py(ring[i][1]);
          if (i === 0) mg.moveTo(x, y); else mg.lineTo(x, y);
        }
        mg.closePath(); mg.fill();
      });
    });

    /* ---- 两个画布：连片区域（裁剪到陆地）+ 据点（不裁剪） ---- */
    function layer(radiusMul, order) {
      var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var tex = new THREE.CanvasTexture(cv);
      tex.needsUpdate = true;
      var mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, depthWrite: false, opacity: 0.96
      });
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * radiusMul, 96, 64), mat);
      mesh.renderOrder = order;
      return { cv: cv, ctx: cv.getContext('2d'), tex: tex, mesh: mesh };
    }
    var areaL = layer(1.0075, 1);
    var postL = layer(1.0084, 1);

    var areaOn = true, postOn = true;
    var lastYear = null, curYear = 1405;
    var counts = {};

    // 取样用的一像素画布（getImageData 需要 willReadFrequently）
    var probeCv = document.createElement('canvas');
    probeCv.width = probeCv.height = 1;
    var probeCtx = probeCv.getContext('2d', { willReadFrequently: true });
    function alphaAt(cv, lon, lat) {
      var x = Math.round(px(lon)), y = Math.round(py(lat));
      if (x < 0 || x >= W || y < 0 || y >= H) return -1;
      probeCtx.clearRect(0, 0, 1, 1);
      probeCtx.drawImage(cv, x, y, 1, 1, 0, 0, 1, 1);
      return probeCtx.getImageData(0, 0, 1, 1).data[3];
    }

    // 预先把每个区域的多边形揉成有机边界（只做一次）
    S.regions.forEach(function (r, i) {
      r._w = r.k === 'post' ? r.r : warpRing(r.r, (i + 1) * 3.77);
    });

    function hatch(g, poly, color) {
      g.save(); g.beginPath();
      for (var i = 0; i < poly.length; i++) {
        var x = px(poly[i][0]), y = py(poly[i][1]);
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
      g.fillStyle = color; g.globalAlpha *= 0.5; g.fill();
      g.globalAlpha = 1;
      g.clip();
      g.strokeStyle = color; g.lineWidth = 0.7; g.globalAlpha = 0.55;
      for (var k = -H; k < W + H; k += 7) {
        g.beginPath(); g.moveTo(k, 0); g.lineTo(k + H, H); g.stroke();
      }
      g.restore();
    }

    function drawPost(g, r, polity) {
      var lon = 0, lat = 0, n = r.r.length;
      for (var i = 0; i < n; i++) { lon += r.r[i][0]; lat += r.r[i][1]; }
      lon /= n; lat /= n;
      var x = px(lon), y = py(lat);
      g.beginPath(); g.arc(x, y, 6.5, 0, Math.PI * 2);
      g.fillStyle = polity.color; g.globalAlpha = 0.55; g.fill();
      g.globalAlpha = 1;
      g.lineWidth = 1.2; g.strokeStyle = polity.color; g.stroke();
      g.beginPath(); g.arc(x, y, 2.2, 0, Math.PI * 2);
      g.fillStyle = '#fff8e6'; g.globalAlpha = 0.95; g.fill();
      g.globalAlpha = 1;
    }

    function redraw(y) {
      var a = areaL.ctx, p = postL.ctx;
      a.clearRect(0, 0, W, H);
      p.clearRect(0, 0, W, H);
      counts = {};
      var list = S.activeAt(y);
      list.forEach(function (r) {
        var polity = null;
        for (var i = 0; i < S.polities.length; i++) if (S.polities[i].id === r.p) { polity = S.polities[i]; break; }
        if (!polity) return;
        counts[r.p] = (counts[r.p] || 0) + 1;
        if (r.k === 'post') {
          if (postOn) drawPost(p, r, polity);
        } else if (r.p === 'il') {
          if (areaOn) hatch(a, r._w, polity.color);
        } else if (areaOn) {
          // 连片色块：低透明度填充 + 虚线描边，读作「势力所及的概略范围」而非国界
          var poly = r._w;
          a.beginPath();
          for (var i2 = 0; i2 < poly.length; i2++) {
            var x = px(poly[i2][0]), y = py(poly[i2][1]);
            if (i2 === 0) a.moveTo(x, y); else a.lineTo(x, y);
          }
          a.closePath();
          a.globalAlpha = 0.17; a.fillStyle = polity.color; a.fill();
          a.setLineDash([4, 3]);
          a.globalAlpha = 0.55; a.lineWidth = 1.0; a.strokeStyle = polity.color; a.stroke();
          a.setLineDash([]);
          a.globalAlpha = 1;
        }
      });
      // 裁到陆地：色块不越海
      a.globalCompositeOperation = 'destination-in';
      a.drawImage(mcv, 0, 0, W, H);
      a.globalCompositeOperation = 'source-over';

      areaL.tex.needsUpdate = true;
      postL.tex.needsUpdate = true;
      lastYear = y;
      curYear = y;
    }

    var group = new THREE.Group();
    group.name = 'spheres';
    group.add(areaL.mesh); group.add(postL.mesh);

    return {
      group: group,
      setYear: function (y) {
        var iy = Math.floor(y);
        if (iy !== lastYear) redraw(iy);
      },
      setVisible: function (on) {
        areaOn = !!on; postOn = !!on;
        areaL.mesh.visible = areaOn;
        postL.mesh.visible = postOn;
        lastYear = null;
        redraw(curYear);
      },
      setAreaVisible: function (on) { areaOn = !!on; areaL.mesh.visible = areaOn; lastYear = null; redraw(curYear); },
      setPostVisible: function (on) { postOn = !!on; postL.mesh.visible = postOn; lastYear = null; redraw(curYear); },
      isVisible: function () { return areaOn || postOn; },
      counts: function () { return counts; },
      // 取样某个经纬点的色块透明度（供验证「色块已被陆地掩膜裁掉海面」）
      sampleAlpha: function (lon, lat) { return alphaAt(areaL.cv, lon, lat); },
      maskAlpha: function (lon, lat) { return alphaAt(mcv, lon, lat); },
      debug: function () {
        return {
          year: lastYear, visible: areaOn || postOn,
          regions: Object.keys(counts).reduce(function (s, k) { return s + counts[k]; }, 0),
          counts: counts,
          oceanSample: this.sampleAlpha(-30, 20),
          landSample: this.sampleAlpha(-70, -10),
          maskOcean: this.maskAlpha(-30, 20),
          maskLand: this.maskAlpha(-70, -10)
        };
      }
    };
  }

  global.PowerLayer = { build: build, WIDTH: W, HEIGHT: H };
})(window);
