"""Decode world-atlas land-110m TopoJSON into a compact JS polygon array.

Output: data/land.js  ->  window.WORLD_LAND = [ ring, ring, ... ]
Each ring is [[lon, lat], ...] in decimal degrees, implicitly closed.
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "land-110m.json")
OUT = os.path.join(ROOT, "data", "land.js")

topo = json.load(open(SRC, encoding="utf-8"))
scale = topo["transform"]["scale"]
translate = topo["transform"]["translate"]
sx, sy = scale
tx, ty = translate

# TopoJSON arcs are delta encoded in quantized coordinates.
arcs = []
for arc in topo["arcs"]:
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx
        y += dy
        pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)


def arc_pts(idx):
    return arcs[idx] if idx >= 0 else list(reversed(arcs[~idx]))


def ring_pts(idxs):
    out = []
    for i in idxs:
        seg = arc_pts(i)
        if out:
            seg = seg[1:]
        out.extend(seg)
    return out


def perp_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    if dx == 0 and dy == 0:
        return math.hypot(p[0] - a[0], p[1] - a[1])
    t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))


def rdp(pts, eps):
    if len(pts) <= 2:
        return pts
    a, b = pts[0], pts[-1]
    best, idx = -1.0, 0
    for i in range(1, len(pts) - 1):
        d = perp_dist(pts[i], a, b)
        if d > best:
            best, idx = d, i
    if best <= eps:
        return [a, b]
    return rdp(pts[: idx + 1], eps)[:-1] + rdp(pts[idx:], eps)


def simplify_ring(ring, eps):
    if len(ring) > 1 and ring[0] == ring[-1]:
        ring = ring[:-1]
    if len(ring) < 4:
        return []
    n = len(ring)
    far = max(
        range(n),
        key=lambda i: (ring[i][0] - ring[0][0]) ** 2 + (ring[i][1] - ring[0][1]) ** 2,
    )
    if far < 2 or far > n - 3:
        return rdp(ring + [ring[0]], eps)[:-1]
    a = rdp(ring[: far + 1], eps)
    b = rdp(ring[far:] + [ring[0]], eps)
    out = a[:-1] + b[:-1]
    return out if len(out) >= 3 else []


def collect(geom):
    t = geom["type"]
    if t == "GeometryCollection":
        for g in geom["geometries"]:
            yield from collect(g)
    elif t == "MultiPolygon":
        for poly in geom["arcs"]:
            for ring in poly:
                yield ring_pts(ring)
    elif t == "Polygon":
        for ring in geom["arcs"]:
            yield ring_pts(ring)


rings = []
for raw in collect(topo["objects"]["land"]):
    s = simplify_ring(raw, 0.16)
    if not s:
        continue
    # Skip visually negligible specks, keep recognizable coastlines.
    lons = [p[0] for p in s]
    lats = [p[1] for p in s]
    if (max(lons) - min(lons)) < 0.35 and (max(lats) - min(lats)) < 0.35:
        continue
    rings.append([[round(p[0], 2), round(p[1], 2)] for p in s])

body = ",\n".join(
    "[" + ",".join("[%g,%g]" % (p[0], p[1]) for p in r) + "]" for r in rings
)
with open(OUT, "w", encoding="utf-8") as f:
    f.write("// Natural Earth 1:110m land, decoded from world-atlas@2 TopoJSON (simplified).\n")
    f.write("window.WORLD_LAND = [\n" + body + "\n];\n")

print("rings:", len(rings), "points:", sum(len(r) for r in rings))
print("output:", OUT, os.path.getsize(OUT), "bytes")
