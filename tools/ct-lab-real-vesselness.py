# Step 2 of the CT Lab real-case pipeline (after tools/ct-lab-real-export.py): vesselness of the exported CTA.
# Reads public/ct-lab/real (the PNG mosaics) and writes sim_cta.npy, sim_tag.npy, sim_vess.npy and projection images
# into a work folder, for picking the coronary endpoints used by ct-lab-real-centrelines.py.
#   python tools/ct-lab-real-vesselness.py public/ct-lab/real <work folder>
# Vesselness of the real CTA on the simulator grid, with projections for picking centreline endpoints.
import sys, os, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage.filters import frangi
real, out = sys.argv[1], sys.argv[2]
meta = json.load(open(os.path.join(real, 'meta.json')))
NX = NY = 224; NZ = 160; X0 = -95; Y0 = -100; Z0 = -80; DX = 200 / 224; DZ = 140 / 160
def load(files, q, nz, bits16=True):
    vol = np.zeros((nz, NY, NX), np.int16 if bits16 else np.uint8)
    for f, fn in enumerate(files):
        a = np.asarray(Image.open(os.path.join(real, fn)).convert('RGB'))
        for t in range(16):
            k = f * 16 + t
            if k >= nz: break
            r, c = divmod(t, 4); tile = a[r * NY:(r + 1) * NY, c * NX:(c + 1) * NX]
            vol[k] = (tile[:, :, 0].astype(np.int32) * 256 + tile[:, :, 1]) * q - 1024 if bits16 else tile[:, :, 0]
    return vol
CTA = load(meta['cta'], meta['ctaQ'], NZ); TAG = load(meta['tag'], 1, NZ, False)
np.save(os.path.join(out, 'sim_cta.npy'), CTA); np.save(os.path.join(out, 'sim_tag.npy'), TAG)
heart = (TAG >> 3) == 1
# vesselness: bright tubes 1-4 mm wide, computed on HU clipped so calcium does not dominate; only around the heart
v = np.clip(CTA.astype(np.float32), -200, 600)
hd = ndi.binary_dilation(heart, iterations=6)
fr = frangi(v, sigmas=[0.8, 1.2, 1.8, 2.5], black_ridges=False, alpha=0.5, beta=0.5, gamma=80)
fr = fr.astype(np.float32) * hd
# the big blood pools (chambers, aorta) are not tubes but their edges score: suppress where a 2 mm neighbourhood is all bright
pool = ndi.uniform_filter((CTA > 250).astype(np.float32), 5) > 0.85
fr[pool] = 0
np.save(os.path.join(out, 'sim_vess.npy'), fr)
print('vesselness max', fr.max(), 'p99.9', np.percentile(fr, 99.9))
def proj(a, axis, name, ext_u, ext_v, flipv=False):
    m = a.max(axis=axis)
    if flipv: m = m[::-1]
    im = (np.clip(m / np.percentile(m, 99.8), 0, 1) ** 0.6 * 255).astype(np.uint8)
    S = 4
    im = Image.fromarray(im).convert('RGB').resize((im.shape[1] * S, im.shape[0] * S))
    d = ImageDraw.Draw(im)
    for mm in range(int(np.ceil(ext_u[0] / 10)) * 10, int(ext_u[1]) + 1, 10):
        px = (mm - ext_u[0]) / (ext_u[1] - ext_u[0]) * im.size[0]; d.line([(px, 0), (px, im.size[1])], fill=(70, 70, 0) if mm % 20 else (120, 120, 0))
        if mm % 20 == 0: d.text((px + 2, 2), str(mm), fill=(255, 255, 0))
    for mm in range(int(np.ceil(ext_v[0] / 10)) * 10, int(ext_v[1]) + 1, 10):
        py = (mm - ext_v[0]) / (ext_v[1] - ext_v[0]) * im.size[1]
        if flipv: py = im.size[1] - py
        d.line([(0, py), (im.size[0], py)], fill=(0, 70, 70) if mm % 20 else (0, 120, 120))
        if mm % 20 == 0: d.text((2, py + 2), str(mm), fill=(0, 255, 255))
    im.save(os.path.join(out, name))
# crop to the heart: x -70..80, y -80..60, z -62..60
i0, i1 = int((-70 - X0) / DX), int((80 - X0) / DX); j0, j1 = int((-80 - Y0) / DX), int((60 - Y0) / DX); k0, k1 = int((-62 - Z0) / DZ), int((60 - Z0) / DZ)
sub = fr[k0:k1, j0:j1, i0:i1]
proj(sub, 1, 'vess_ap.png', (-70, 80), (-62, 60), flipv=True)      # anterior view: x across, z up
proj(sub, 2, 'vess_lat.png', (-80, 60), (-62, 60), flipv=True)     # left lateral: y across, z up
proj(sub, 0, 'vess_ax.png', (-70, 80), (-80, 60))                  # from above: x across, y down
print('done')
