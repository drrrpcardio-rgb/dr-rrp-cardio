# Step 4: the real background for the simulated cases: the patient's own coronaries painted out of both series,
# smoothed centrelines, an LV frame; writes bg_*.png / bgc_*.png and updates meta.json.
#   python tools/ct-lab-real-background.py <work folder> public/ct-lab/real
# Build the "real background" for the synthetic cases: the real CTA and calcium series with the patient's own
# coronary arteries painted out along the tracked centrelines, plus the smoothed centrelines and an LV frame.
import sys, os, json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
out, real = sys.argv[1], sys.argv[2]
NX = NY = 224; NZ = 160; X0 = -95; Y0 = -100; Z0 = -80; DX = 200 / 224; DZ = 140 / 160
CTA = np.load(os.path.join(out, 'sim_cta.npy')).astype(np.float32); TAG = np.load(os.path.join(out, 'sim_tag.npy'))
meta = json.load(open(os.path.join(real, 'meta.json')))
def load(files, q, nz):
    vol = np.zeros((nz, NY, NX), np.int16)
    for f, fn in enumerate(files):
        a = np.asarray(Image.open(os.path.join(real, fn)).convert('RGB'))
        for t in range(16):
            k = f * 16 + t
            if k >= nz: break
            r, c = divmod(t, 4); tile = a[r * NY:(r + 1) * NY, c * NX:(c + 1) * NX]
            vol[k] = (tile[:, :, 0].astype(np.int32) * 256 + tile[:, :, 1]) * q - 1024
    return vol
CAC2 = load(meta['cac'], meta['cacQ'], NZ // 2).astype(np.float32)  # every second slice
lines = json.load(open(os.path.join(out, 'centerlines.json')))
# smooth each path (about 3 mm) and resample at 1 mm; trim the RCA where it dives below the crux
def smooth(pts, sig=2.5):
    a = np.array(pts, np.float32)
    if len(a) < 5: return a
    return np.stack([ndi.gaussian_filter1d(a[:, k], sig, mode='nearest') for k in range(3)], 1)
def resample(a, step=1.0):
    seg = np.linalg.norm(np.diff(a, axis=0), axis=1); cum = np.concatenate([[0], np.cumsum(seg)])
    s = np.arange(0, cum[-1], step)
    return np.stack([np.interp(s, cum, a[:, k]) for k in range(3)], 1)
paths = {}
for k, pts in lines.items():
    a = np.array(pts, np.float32)
    if k == 'RCA':
        below = np.where(a[:, 2] < -41)[0]
        if len(below): a = a[:below[0] + 1]
    paths[k] = resample(smooth(a))
# branches must start exactly on the (smoothed) parent
parent = {'LAD': 'LM', 'LCX': 'LM', 'D1': 'LAD', 'OM1': 'LCX', 'PDA': 'RCA', 'PLB': 'RCA', 'AM': 'RCA'}
for k, par in parent.items():
    P = paths[par]; i = int(np.argmin(np.linalg.norm(P - paths[k][0], axis=1)))
    paths[k] = np.vstack([P[i:i + 1], paths[k][1:]]) if k not in ('LAD', 'LCX') else np.vstack([P[-1:], paths[k][1:]])
for k, a in paths.items(): print(k, len(a), 'mm')
# paint the real arteries out: inside a tube round each centreline the value becomes the local tissue outside it
tubeR = {'LM': 4.5, 'LAD': 4.2, 'LCX': 4.0, 'RCA': 4.6, 'D1': 3.0, 'OM1': 3.0, 'PDA': 3.0, 'PLB': 3.0, 'AM': 2.6}
zs = Z0 + (np.arange(NZ) + 0.5) * DZ; ys = Y0 + (np.arange(NY) + 0.5) * DX; xs = X0 + (np.arange(NX) + 0.5) * DX
Zg, Yg, Xg = np.meshgrid(zs, ys, xs, indexing='ij')
M = np.zeros(CTA.shape, bool)
for k, a in paths.items():
    r = tubeR[k]
    for p in a[::2]:
        i0, i1 = int((p[0] - r - 1 - X0) / DX), int((p[0] + r + 1 - X0) / DX) + 1; j0, j1 = int((p[1] - r - 1 - Y0) / DX), int((p[1] + r + 1 - Y0) / DX) + 1; k0, k1 = int((p[2] - r - 1 - Z0) / DZ), int((p[2] + r + 1 - Z0) / DZ) + 1
        sub = (Xg[k0:k1, j0:j1, i0:i1] - p[0]) ** 2 + (Yg[k0:k1, j0:j1, i0:i1] - p[1]) ** 2 + (Zg[k0:k1, j0:j1, i0:i1] - p[2]) ** 2
        M[k0:k1, j0:j1, i0:i1] |= sub < r * r
# also any calcium (bright on the non-contrast series) within 7 mm of a trunk, so blooming stubs do not remain
CACf = np.repeat(CAC2, 2, axis=0)[:NZ]
Mc = ndi.binary_dilation(M, iterations=3) & (CACf > 160)
M |= ndi.binary_dilation(Mc, iterations=1)
print('painted voxels', int(M.sum()))
def inpaint(vol, M, sig=3.0, noise=0.0, seed=1):
    w = (~M).astype(np.float32)
    num = ndi.gaussian_filter(vol * w, sig); den = ndi.gaussian_filter(w, sig)
    fill = num / np.maximum(den, 1e-3)
    outv = vol.copy(); outv[M] = fill[M]
    if noise > 0:
        rng = np.random.default_rng(seed); n = ndi.gaussian_filter(rng.standard_normal(vol.shape).astype(np.float32), 0.6)
        n *= noise / n.std(); outv[M] += n[M]
    return outv
BG = inpaint(CTA, M, 3.0, 19.0)
M2 = M[::2]
BGC = inpaint(CAC2, M2, 2.5, 11.0, 2)
BG = np.clip(np.round(BG), -1024, 3071).astype(np.int16); BGC = np.clip(np.round(BGC), -1024, 3071).astype(np.int16)
def mosaics(vol, name, q):
    files = []; nz = vol.shape[0]
    for f in range(0, nz, 16):
        sheet = np.zeros((4 * NY, 4 * NX, 3), np.uint8)
        for t in range(16):
            k = f + t
            if k >= nz: break
            r, c = divmod(t, 4); v = np.clip((vol[k].astype(np.int32) + 1024) // q, 0, 4095)
            sheet[r * NY:(r + 1) * NY, c * NX:(c + 1) * NX, 0] = v >> 8; sheet[r * NY:(r + 1) * NY, c * NX:(c + 1) * NX, 1] = v & 255
        fn = f'{name}_{f // 16:02d}.png'; Image.fromarray(sheet).save(os.path.join(real, fn), optimize=True); files.append(fn)
    return files
bgF = mosaics(BG, 'bg', 2); bgcF = mosaics(BGC, 'bgc', 4)
print('bytes bg', sum(os.path.getsize(os.path.join(real, f)) for f in bgF), 'bgc', sum(os.path.getsize(os.path.join(real, f)) for f in bgcF))
# LV frame: long axis from the mitral centre to the apex, cavity radius along it (for the infarct case)
base = np.array([4.0, 10.0, 10.0]); apex = paths['LAD'][-1] + np.array([-3, 6, 2]); e1 = apex - base; HL = float(np.linalg.norm(e1)); e1 /= HL
r = np.array([-1.0, -0.35, 0.0]); e2 = r - e1 * np.dot(r, e1); e2 /= np.linalg.norm(e2); e3 = np.cross(e2, e1)
P = np.stack([Xg, Yg, Zg], -1) - base
A = P @ e1; C2 = P @ e2; C3 = P @ e3; rho = np.sqrt(C2 ** 2 + C3 ** 2)
cav = (CTA > 250) & (A > 0) & (A < HL) & (rho < 36) & ((TAG >> 3) == 1)
rendo = []
for a in range(0, int(HL) + 1, 4):
    sel = cav & (np.abs(A - a) < 2)
    rendo.append(round(float(np.sqrt(sel.sum() * DX * DX * DZ / 4 / np.pi)) if sel.sum() else 0.0, 1))
print('LV frame', base, e1, HL, rendo)
lv = {'B': base.round(1).tolist(), 'e1': e1.round(3).tolist(), 'e2': e2.round(3).tolist(), 'e3': e3.round(3).tolist(), 'HL': round(HL, 1), 'step': 4, 'rendo': rendo, 'wall': 9}
meta['bg'] = bgF; meta['bgc'] = bgcF; meta['bgQ'] = 2; meta['bgcQ'] = 4
meta['centerlines'] = {k: [[round(float(x), 1) for x in p] for p in a] for k, a in paths.items()}
meta['lv'] = lv
json.dump(meta, open(os.path.join(real, 'meta.json'), 'w'), indent=1)
# check sheet: cleaned CTA with the centrelines
tiles = []
for zmm in range(-56, 49, 8):
    k = int(round((zmm - Z0) / DZ - 0.5)); a = BG[k][11:179, 28:196]
    from PIL import ImageDraw
    im = Image.fromarray(np.clip((a + 150) / 800 * 255, 0, 255).astype(np.uint8)).convert('RGB').resize((504, 504)); d = ImageDraw.Draw(im)
    for name, pts in paths.items():
        for p in pts:
            if abs(p[2] - zmm) < 1.2:
                px = (p[0] - (X0 + 28 * DX)) / DX * 3; py = (p[1] - (Y0 + 11 * DX)) / DX * 3
                d.ellipse([px - 3, py - 3, px + 3, py + 3], outline=(255, 60, 60))
    d.text((440, 488), f'z={zmm}', fill=(255, 0, 0)); tiles.append(im)
sheet = Image.new('RGB', (4 * 504, ((len(tiles) + 3) // 4) * 504))
for n, t in enumerate(tiles): sheet.paste(t, ((n % 4) * 504, (n // 4) * 504))
sheet.save(os.path.join(out, 'bg_slices.png'))
print('done')
