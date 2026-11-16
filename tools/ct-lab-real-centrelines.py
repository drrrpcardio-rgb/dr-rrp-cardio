# Step 3: coronary centrelines as minimal-cost paths on the vesselness map, between endpoints listed in
# <work folder>/endpoints.json as  name: [start, end, snapStart, snapEnd, 'shell'?]  where start may be 'PARENT@mm',
# end may be a list of [point, snap] waypoints, and 'shell' keeps a thin branch in the epicardial shell.
# Writes centerlines.json and overlay images to check.   python tools/ct-lab-real-centrelines.py <work folder>
# Track coronary centrelines on the vesselness map: minimal cost paths between hand-picked endpoints (snapped
# to the strongest nearby vessel). Writes centrelines (simulator mm) and overlay images for checking.
import sys, os, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage.graph import route_through_array
out = sys.argv[1]
CTA = np.load(os.path.join(out, 'sim_cta.npy')); V = np.load(os.path.join(out, 'sim_vess.npy'))
NX = NY = 224; NZ = 160; X0 = -95; Y0 = -100; Z0 = -80; DX = 200 / 224; DZ = 140 / 160
to_ijk = lambda p: (int(round((p[2] - Z0) / DZ - 0.5)), int(round((p[1] - Y0) / DX - 0.5)), int(round((p[0] - X0) / DX - 0.5)))
to_mm = lambda k, j, i: [X0 + (i + 0.5) * DX, Y0 + (j + 0.5) * DX, Z0 + (k + 0.5) * DZ]
# cost: cheap along bright tubes; contrast-filled lumen required (HU > 120), bone and valve calcium allowed but dear
bright = np.clip((CTA.astype(np.float32) - 190) / 180, 0, 1)
score = V * (0.25 + 0.75 * bright)
cost = 1.0 / (score + 0.004)
cost[CTA < 60] *= 6
# chambers and great vessels are out of bounds
pool = ndi.binary_dilation(ndi.uniform_filter((CTA > 250).astype(np.float32), 5) > 0.85, iterations=1)
cost[pool] *= 40
# epicardial shell: 1-6 mm outside the blood pool, inside the heart: thin branches must run here
TAG = np.load(os.path.join(out, 'sim_tag.npy')); heart = ndi.binary_dilation((TAG >> 3) == 1, iterations=3)
Dm = ndi.distance_transform_edt(~ndi.binary_dilation(CTA > 250, iterations=1), sampling=(DZ, DX, DX))
shell = (Dm > 1.0) & (Dm < 6.0) & heart
costS = 1.0 / (score + 0.02)
costS[~shell] *= 30
costS[pool] *= 40
def snap(p, r):
    k, j, i = to_ijk(p); rk, rj = int(r / DZ), int(r / DX)
    sub = score[max(0, k - rk):k + rk + 1, max(0, j - rj):j + rj + 1, max(0, i - rj):i + rj + 1]
    kk, jj, ii = np.unravel_index(sub.argmax(), sub.shape)
    return (max(0, k - rk) + kk, max(0, j - rj) + jj, max(0, i - rj) + ii)
def snapShell(p, r):
    k, j, i = to_ijk(p); rk, rj = int(r / DZ), int(r / DX)
    sub = shell[max(0, k - rk):k + rk + 1, max(0, j - rj):j + rj + 1, max(0, i - rj):i + rj + 1]
    if not sub.any(): return (k, j, i)
    idx = np.argwhere(sub); c = np.array([min(k, rk), min(j, rj), min(i, rj)])
    best = idx[np.argmin(((idx - c) * [DZ, DX, DX]).__pow__(2).sum(1))]
    return (max(0, k - rk) + best[0], max(0, j - rj) + best[1], max(0, i - rj) + best[2])
USE_SHELL = False
def track(a, b, ra=4, rb=8):
    if USE_SHELL:
        A = to_ijk(a) if ra == 0 else snapShell(a, ra); B = snapShell(b, rb)
        path, c = route_through_array(costS, A, B, fully_connected=True, geometric=True)
        return [to_mm(*p) for p in path], c
    A, B = (snap(a, ra) if ra > 0 else to_ijk(a)), (snap(b, rb) if rb > 0 else to_ijk(b))
    path, c = route_through_array(cost, A, B, fully_connected=True, geometric=True)
    return [to_mm(*p) for p in path], c
spec = json.load(open(os.path.join(out, 'endpoints.json')))
lines = {}
for name, (a, b, ra, rb, *mode) in spec.items():
    USE_SHELL = bool(mode and mode[0] == 'shell')
    # a may name another vessel and a distance along it: branch start
    if isinstance(a, str):
        par, dist = a.split('@'); pts = lines[par]; cum = np.cumsum([0] + [np.linalg.norm(np.subtract(pts[i], pts[i - 1])) for i in range(1, len(pts))])
        a = pts[min(len(pts) - 1, int(np.searchsorted(cum, float(dist))))]
    if isinstance(b[0], list) and isinstance(b[0][0], list):
        pts, c = [], 0
        cur, cr = a, ra
        for (w, rw) in b:
            seg, cc = track(cur, w, cr, rw); pts += seg[1:] if pts else seg; c += cc; cur, cr = seg[-1], 0
    else:
        pts, c = track(a, b, ra, rb)
    L = sum(np.linalg.norm(np.subtract(pts[i], pts[i - 1])) for i in range(1, len(pts)))
    print(f'{name}: {len(pts)} pts, {L:.0f} mm, cost {c:.0f}, start {np.round(pts[0], 1)} end {np.round(pts[-1], 1)}')
    lines[name] = pts
json.dump({k: [[round(x, 1) for x in p] for p in v] for k, v in lines.items()}, open(os.path.join(out, 'centerlines.json'), 'w'))
# overlays on the vesselness projections and on axial slices
def overlay(axis, name, ext_u, ext_v, flipv, ui, vi):
    i0, i1 = int((-70 - X0) / DX), int((80 - X0) / DX); j0, j1 = int((-80 - Y0) / DX), int((60 - Y0) / DX); k0, k1 = int((-62 - Z0) / DZ), int((60 - Z0) / DZ)
    m = V[k0:k1, j0:j1, i0:i1].max(axis=axis)
    if flipv: m = m[::-1]
    im = (np.clip(m / np.percentile(m, 99.8), 0, 1) ** 0.6 * 160).astype(np.uint8)
    S = 4; im = Image.fromarray(im).convert('RGB').resize((im.shape[1] * S, im.shape[0] * S)); d = ImageDraw.Draw(im)
    cols = {'LM': (255, 200, 0), 'LAD': (255, 80, 80), 'LCX': (80, 230, 160), 'RCA': (90, 170, 255), 'D1': (255, 140, 140), 'OM1': (140, 255, 200), 'PDA': (150, 200, 255), 'PLB': (180, 210, 255), 'AM': (120, 180, 255), 'D2': (255, 170, 170), 'OM2': (170, 255, 220)}
    for k, pts in lines.items():
        q = [((p[ui] - ext_u[0]) / (ext_u[1] - ext_u[0]) * im.size[0], (1 - (p[vi] - ext_v[0]) / (ext_v[1] - ext_v[0])) * im.size[1] if flipv else (p[vi] - ext_v[0]) / (ext_v[1] - ext_v[0]) * im.size[1]) for p in pts]
        d.line(q, fill=cols.get(k, (255, 255, 255)), width=2); d.text(q[-1], k, fill=cols.get(k, (255, 255, 255)))
    im.save(os.path.join(out, name))
overlay(1, 'track_ap.png', (-70, 80), (-62, 60), True, 0, 2)
overlay(2, 'track_lat.png', (-80, 60), (-62, 60), True, 1, 2)
overlay(0, 'track_ax.png', (-70, 80), (-80, 60), False, 0, 1)
# axial slices every 8 mm with the centreline crossings marked
tiles = []
for zmm in range(-56, 49, 8):
    k = int(round((zmm - Z0) / DZ - 0.5)); a = CTA[k][11:179, 28:196]
    im = Image.fromarray(np.clip((a + 150) / 800 * 255, 0, 255).astype(np.uint8)).convert('RGB').resize((504, 504)); d = ImageDraw.Draw(im)
    for name, pts in lines.items():
        for p in pts:
            if abs(p[2] - zmm) < 2.2:
                px = (p[0] - (X0 + 28 * DX)) / DX * 3; py = (p[1] - (Y0 + 11 * DX)) / DX * 3
                d.ellipse([px - 4, py - 4, px + 4, py + 4], outline=(255, 60, 60)); d.text((px + 5, py - 5), name, fill=(255, 200, 0))
    d.text((440, 488), f'z={zmm}', fill=(255, 0, 0)); tiles.append(im)
sheet = Image.new('RGB', (4 * 504, ((len(tiles) + 3) // 4) * 504))
for n, t in enumerate(tiles): sheet.paste(t, ((n % 4) * 504, (n // 4) * 504))
sheet.save(os.path.join(out, 'track_slices.png'))
print('done')
