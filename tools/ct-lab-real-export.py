# Export a real coronary CT study (DICOM) into the CT Lab's de-identified on-demand case files.
#
#   python tools/ct-lab-real-export.py <CTA series folder> <calcium-score series folder> public/ct-lab/real
#
# Reads only the pixel data (no names, dates or other headers survive), resamples both series onto the
# simulator grid (224 x 224 x 160 voxels, 200 x 200 x 140 mm) and writes:
#   cta_NN.png  the CTA, 16 slices per PNG (4 x 4), red = high byte, green = low byte of (HU + 1024) / ctaQ
#   cac_NN.png  the non-contrast series, every second slice, same packing with cacQ
#   tag_NN.png  tissue tags (heart, bone, fat, lung) in the red byte, as ct-lab.js uses them
#   meta_base.json  grid and file lists, to merge into meta.json (which also holds the hand-placed labels,
#                   centrelines, calcium assignments, vendor image groups and the answer key)
# The DICOM study itself must never be committed. Needs pydicom, numpy, scipy, Pillow.
import sys, os, glob, json
import numpy as np, pydicom
from PIL import Image
from scipy import ndimage as ndi

cta_dir, cac_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)

def load_series(folder):
    files = sorted(glob.glob(os.path.join(folder, '*.dcm'))) or sorted(glob.glob(os.path.join(folder, '*')))
    ds = [pydicom.dcmread(f) for f in files]
    ds = [d for d in ds if 'ImagePositionPatient' in d]
    ds.sort(key=lambda d: float(d.ImagePositionPatient[2]))
    vol = np.stack([d.pixel_array.astype(np.float32) * float(d.get('RescaleSlope', 1)) + float(d.get('RescaleIntercept', 0)) for d in ds])
    o = np.array([float(v) for v in ds[0].ImagePositionPatient])
    sp = np.array([float(ds[0].PixelSpacing[1]), float(ds[0].PixelSpacing[0]), abs(float(ds[1].ImagePositionPatient[2]) - float(ds[0].ImagePositionPatient[2]))])
    return vol, o, sp

cta, cta_o, cta_sp = load_series(cta_dir)
cac, cac_o, cac_sp = load_series(cac_dir)
print('CTA', cta.shape, cta_o, cta_sp, ' CAC', cac.shape, cac_o, cac_sp)

# simulator grid (must match ct-lab.js) and the DICOM-to-simulator offset: dcm = sim + OFF.
# Choose OFF so the heart centre lands near sim (8, -22, 0) and the left main ostium near z = 40.
NX = NY = 224; NZ = 160; FOV = 200; ZLEN = 140; X0 = -95; Y0 = -100; Z0 = -80; DX = FOV / NX; DZ = ZLEN / NZ
OFF = np.array([float(v) for v in os.environ.get('CTLAB_OFF', '42,-43,775').split(',')])
xs = X0 + (np.arange(NX) + 0.5) * DX; ys = Y0 + (np.arange(NY) + 0.5) * DX; zs = Z0 + (np.arange(NZ) + 0.5) * DZ

def resample(vol, o, sp, sig):
    v = ndi.gaussian_filter(vol, sig)  # anti-alias before downsampling (z, y, x order)
    Z, Y, X = np.meshgrid((zs + OFF[2] - o[2]) / sp[2], (ys + OFF[1] - o[1]) / sp[1], (xs + OFF[0] - o[0]) / sp[0], indexing='ij')
    return ndi.map_coordinates(v, [Z, Y, X], order=1, mode='constant', cval=-1024.0)

def clean(v):  # air outside the body becomes exactly -1000, which compresses well
    air = ndi.gaussian_filter(v, 3) < -950
    v = v.copy(); v[air] = -1000; return v

print('resampling'); CTA = resample(cta, cta_o, cta_sp, (0.9, 1.0, 1.0)); CAC = resample(cac, cac_o, cac_sp, (0.25, 0.6, 0.6))
zlo = cta_o[2] - OFF[2]; zhi = cta_o[2] + (cta.shape[0] - 1) * cta_sp[2] - OFF[2]
czlo = cac_o[2] - OFF[2]; czhi = cac_o[2] + (cac.shape[0] - 1) * cac_sp[2] - OFF[2]
CTA = np.clip(np.round(clean(CTA)), -1024, 3071).astype(np.int16); CAC = np.clip(np.round(clean(CAC)), -1024, 3071).astype(np.int16)

# tags: heart (region grown inside an ellipsoid), bone and chest-wall calcium (dense on the non-contrast series,
# connected to the chest wall or large), fat, lung
L_BODY, L_HEART, L_BONE, L_FAT, L_LUNG = 0, 1, 2, 5, 6
Zg, Yg, Xg = np.meshgrid(zs, ys, xs, indexing='ij')
ell = (((Xg - 10) / 74) ** 2 + ((Yg + 20) / 62) ** 2 + ((Zg + 6) / 70) ** 2 < 1) & (Yg > -66)
soft = ndi.binary_erosion((CTA > -150) & ell, iterations=3)
lab, n = ndi.label(soft)
seed = lab[np.abs(zs - 0).argmin(), np.abs(ys + 20).argmin(), np.abs(xs - 10).argmin()]
heart = ndi.binary_dilation(lab == seed, iterations=3) & (CTA > -300)
dense = CAC > 130
dl, dn = ndi.label(dense)
sizes = ndi.sum(dense, dl, range(1, dn + 1)); ymin = ndi.minimum(Yg, dl, range(1, dn + 1))
wall = np.zeros(dn + 1, bool)
for i in range(1, dn + 1):
    if sizes[i - 1] > 400 or ymin[i - 1] < -64: wall[i] = True
bone = ndi.binary_dilation(wall[dl], iterations=2) & (CAC > 100)
heart = heart & ~bone
TAG = np.full(CTA.shape, L_BODY, np.uint8)
TAG[(CTA > -200) & (CTA < -40) & ~heart] = L_FAT
TAG[(CTA < -500) & ~heart] = L_LUNG; TAG[heart] = L_HEART; TAG[bone] = L_BONE
TAG <<= 3

def mosaics(vol, name, bits16=True, q=1):
    files = []; nz = vol.shape[0]
    for f in range(0, nz, 16):
        sheet = np.zeros((4 * NY, 4 * NX, 3), np.uint8)
        for t in range(16):
            k = f + t
            if k >= nz: break
            r, c = divmod(t, 4); tile = vol[k]
            if bits16:
                v = np.clip((tile.astype(np.int32) + 1024) // q, 0, 4095)
                sheet[r * NY:(r + 1) * NY, c * NX:(c + 1) * NX, 0] = v >> 8
                sheet[r * NY:(r + 1) * NY, c * NX:(c + 1) * NX, 1] = v & 255
            else:
                sheet[r * NY:(r + 1) * NY, c * NX:(c + 1) * NX, 0] = tile
        fn = f'{name}_{f // 16:02d}.png'; Image.fromarray(sheet).save(os.path.join(out, fn), optimize=True); files.append(fn)
    return files

ctaF = mosaics(CTA, 'cta', q=2); cacF = mosaics(CAC[::2], 'cac', q=4); tagF = mosaics(TAG, 'tag', False)

# coronary calcium candidates (centroids in simulator mm) to assign by hand in meta.json
cal = (CAC >= 130) & heart & ~bone
lab, n = ndi.label(cal)
comps = []
for i in range(1, n + 1):
    m = lab == i; cnt = int(m.sum())
    if cnt < 3: continue
    cz, cy, cx = np.argwhere(m).mean(0)
    comps.append({'n': cnt, 'max': int(CAC[m].max()), 'x': round(float(X0 + (cx + 0.5) * DX), 1), 'y': round(float(Y0 + (cy + 0.5) * DX), 1), 'z': round(float(Z0 + (cz + 0.5) * DZ), 1)})
comps.sort(key=lambda c: -c['n'])
print('calcium candidates (assign each to LM/LAD/LCX/RCA or null in meta.json):')
for c in comps: print('  ', c)

json.dump({'grid': {'nx': NX, 'ny': NY, 'nz': NZ}, 'zRange': [round(float(zlo), 1), round(float(min(zhi, 60)), 1)], 'cacZ': [round(float(czlo), 1), round(float(czhi), 1)],
           'cta': ctaF, 'ctaQ': 2, 'cac': cacF, 'cacQ': 4, 'cacStep': 2, 'tag': tagF, 'calciumCandidates': comps},
          open(os.path.join(out, 'meta_base.json'), 'w'), indent=1)
print('done:', out)
