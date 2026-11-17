/* 定量检查：示意航线是否穿过陆地。
 * 用 Natural Earth 1:110m 陆地环做射线法点包含判定，对比「无绕行点」与「有绕行点」。
 * 用法: node tools/check_landfall.js
 */
const path = require('path');
global.window = global;
require(path.join(__dirname, '..', 'data', 'land.js'));
require(path.join(__dirname, '..', 'data', 'voyages.js'));

const rawRings = window.WORLD_LAND;
const rings = rawRings.map(r => {
  const out = []; let off = 0, prev = r[0][0];
  for (const [lon, lat] of r) {
    let d = lon - prev;
    if (d > 180) off -= 360; else if (d < -180) off += 360;
    out.push([lon + off, lat]); prev = lon;
  }
  return out;
});

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function isLand(lat, lon) {
  for (const ring of rings) {
    for (const s of [-720, -360, 0, 360, 720]) {
      if (inRing(lon + s, lat, ring)) return true;
    }
  }
  return false;
}
function ll2u(lat, lon) {
  const la = lat * Math.PI / 180, lo = (lon + 180) * Math.PI / 180, cl = Math.cos(la);
  return [-cl * Math.cos(lo), Math.sin(la), cl * Math.sin(lo)];
}
function sample(a, b, t) {
  const u = ll2u(a[0], a[1]), v = ll2u(b[0], b[1]);
  const x = u[0] + (v[0] - u[0]) * t, y = u[1] + (v[1] - u[1]) * t, z = u[2] + (v[2] - u[2]) * t;
  const n = Math.hypot(x, y, z);
  const lat = Math.asin(y / n) * 180 / Math.PI;
  // 反推经度：u = (lon+180)/360 对应 x=-cl*cos(lo), z=cl*sin(lo)
  const lo = Math.atan2(z, -x);
  let lon = lo * 180 / Math.PI - 180;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;
  return [lat, lon];
}

function audit(v, useDetours) {
  const pts = v.points.map(p => [p.lat, p.lon]);
  const det = useDetours ? (v.detours || {}) : {};
  let total = 0, land = 0;
  const hits = [];
  for (let s = 0; s < pts.length - 1; s++) {
    const nodes = [pts[s], ...(det[s] || []).map(d => [d[0], d[1]]), pts[s + 1]];
    for (let k = 0; k < nodes.length - 1; k++) {
      for (let i = 2; i <= 18; i++) {
        const t = i / 20;                       // 忽略首尾 10%，港口本就贴岸
        const [la, lo] = sample(nodes[k], nodes[k + 1], t);
        total++;
        if (isLand(la, lo)) { land++; if (hits.length < 6) hits.push(`${la.toFixed(1)},${lo.toFixed(1)}`); }
      }
    }
  }
  return { total, land, pct: (100 * land / total).toFixed(1), hits };
}

console.log('航线穿陆率（示意航路采样，越低越好）');
console.log('说明 1：采样点忽略每段首尾 10%（港口本身贴岸，不计）');
console.log('说明 2：南京龙江关→刘家港为长江内河段、好望角/沃尔维斯湾等为贴岸段，');
console.log('        落在简化陆地多边形内属判定噪声，不代表航路画错。\n');
console.log('人物'.padEnd(22) + '无绕行点'.padEnd(16) + '有绕行点'.padEnd(16) + '改善');
console.log('-'.repeat(68));
let b0 = 0, b1 = 0, t0 = 0, t1 = 0;
for (const v of window.VOYAGES) {
  const a = audit(v, false), b = audit(v, true);
  b0 += a.land; b1 += b.land; t0 += a.total; t1 += b.total;
  const name = (v.no + ' ' + (v.shortName || v.name)).slice(0, 20);
  const delta = parseFloat(a.pct) - parseFloat(b.pct);
  console.log(name.padEnd(22) + `${a.land}/${a.total} (${a.pct}%)`.padEnd(16) +
    `${b.land}/${b.total} (${b.pct}%)`.padEnd(16) +
    (delta >= 0 ? '↓' + delta.toFixed(1) : '↑' + Math.abs(delta).toFixed(1)) + 'pp');
  if (b.land > 0) console.log('   剩余穿陆点示例: ' + b.hits.join('  '));
}
console.log('-'.repeat(68));
console.log(`合计: ${b0}/${t0} (${(100*b0/t0).toFixed(1)}%) -> ${b1}/${t1} (${(100*b1/t1).toFixed(1)}%)`);
