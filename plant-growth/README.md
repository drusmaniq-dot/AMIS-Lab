# Plant Sensitivity Response (web app)

A Flask web port of the original MATLAB/GUIDE desktop app,
`legacy-matlab/PlantSensitivityResponse3.m`. It overlaps a light source's
emission spectrum with a plant (or pigment) sensitivity curve to estimate:

- **Photosynthetic Overlap Score** — how well the light matches the plant's curve
- **Net Plant Growth Efficiency**
- **Daily Light Integral (DLI)**
- **Predicted Daily Biomass Yield**

...and generates a downloadable PDF/PNG report, just like the original app.

## Live architecture

- **Backend:** Python + Flask (`app.py`, `server/`). NumPy/SciPy do the same
  interpolation (`interp1`/`pchip`) and numerical integration (`trapz`) as the
  original MATLAB code; Matplotlib renders the PDF/PNG report.
- **Frontend:** plain HTML/CSS/JS (`templates/`, `static/`), Chart.js (via CDN)
  for the interactive chart. No build step.
- **Data:** `data/emission/*.txt` — the real emission-spectrum measurement
  files that shipped with the original MATLAB project. These are committed to
  the repo on purpose (see "Why data/ is committed" below) so the app has
  working sample spectra the moment it's deployed, without anyone needing to
  upload files first.

## Mapping from the old GUI to this app

| MATLAB GUI element | Web app equivalent |
|---|---|
| `popupmenu1` (17 target curve options) | Step 1 "Select the Plant" dropdown (same 17 options) |
| `popupmenu2` (light-source material) | Step 2 "Select the Target Material for Emission" dropdown — cosmetic label only, same as the original, just shortened (periodic-table symbol instead of the "Emission of ..." wording) |
| `pushbutton1` (load up to 4 `.txt` emission files, combine into `PLdata.mat`) | Step 3 "Select Spectrum" — pick 1-4 spectra from the bundled library or upload your own; combining happens automatically when you click **Calculate**, no separate button |
| `edit3`, `edit5`, `edit7` (PPFD, photoperiod, alpha) | Step 4 "Growth Parameters" inputs, same defaults (500, 16, 108) |
| `pushbutton2` (Calculate + plot + silent PDF/PNG export) | **Calculate** button (chart + metrics) plus separate **Download PDF/PNG report** buttons |
| `edit1`/`edit2`/`edit4` (result text boxes) | The four metric tiles under the results chart |

## Intentional differences from the original MATLAB app

1. **Fixed a real bug in the 4 pigment curves.** Chlorophyll a/b and
   phytochrome Pr/Pfr were built on a 0.5 nm-step query array and then sliced
   *positionally* (`y_chla(1:n)`) instead of being interpolated onto the
   actual analysis wavelength grid — silently using the wrong wavelength axis
   for those 4 curves only. This port interpolates every curve directly onto
   the wavelength grid (see `server/curves.py` docstring). Numeric results for
   these 4 curves will differ from the legacy MATLAB tool; all 13 other curves
   are unaffected and match exactly.
2. **Corrected two copy-pasted display labels.** `SmTm`/`SmEu` had their
   labels swapped, and `SmTmTb` reused the `SmTmNd` label verbatim. Fixed in
   `server/light_sources.py`. These are cosmetic (legend/report text) only —
   no calculation depended on them.
3. **`OmegaNew.m` was intentionally excluded.** It's a separate Judd-Ofelt
   rare-earth-glass spectroscopy calculator that the plant GUI never called,
   and it depends on three `.mat` files not present in this export
   (`RareSegmentArea.mat`, `Eu3+_Tm3+Xmatrix.mat`, `MeanWavelength.mat`). The
   original source is kept in `legacy-matlab/OmegaNew.m` for reference if you
   want to port it later.
4. **"Number of files" is now implicit.** The MATLAB `edit6` field
   ("how many files to load") is replaced by simply letting you add/remove up
   to 4 spectrum slots in the UI — same underlying combine-then-normalize math.

## Why `data/` is committed to the repo

The bundled reference spectra are production data, not build output or
scratch files: without them, a fresh deploy (e.g. on Replit, pulled straight
from GitHub) would have an empty spectrum library and nothing to demo. So
`data/emission/` is deliberately **not** gitignored — anything placed there
and committed becomes available in the "From library" picker automatically
after the next deploy, with no code changes required.

## Local development

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
python app.py                    # serves on http://localhost:8080
pytest                           # run the test suite
```

For a real-browser click-through of the UI (catches issues `pytest` can't, like
a chart plugin misreading its axis type), `requirements-dev.txt` includes
Playwright, reusing your already-installed Chrome (`channel="chrome"`) so
`playwright install` isn't needed:

```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    page = browser.new_page()
    page.goto("http://127.0.0.1:8080/")
    # ...select_option(...) / click(...) / page.screenshot(...)
```

## Deploying on Replit

1. Push this repo to GitHub (already set up if you're reading this from the repo).
2. On Replit: **Create Repl → Import from GitHub** and select this repository.
   Replit detects `requirements.txt` and the `.replit` run command
   automatically (`python3 app.py`).
3. Click **Run**. The app binds to `0.0.0.0` on the `PORT` Replit provides.
4. To publish updates: commit and push to GitHub, then re-import/pull in
   Replit (or connect Replit's GitHub auto-deploy, if enabled for your plan).

## Project structure

```
app.py                   Flask routes
server/
  curves.py              17 target-curve definitions + evaluation
  emission.py             emission spectrum parsing/combining + bundled library
  light_sources.py        cosmetic light-source labels
  analysis.py              overlap/DLI/yield math
  reports.py                PDF/PNG report rendering (Matplotlib)
templates/index.html      single-page UI
static/css, static/js     styling + frontend logic (Chart.js)
data/emission/*.txt       bundled reference emission spectra (production data)
legacy-matlab/            original MATLAB source, kept for provenance
tests/                    pytest suite (server/ math, not the Flask routes)
```

## Note on licensing

`legacy-matlab/license.txt` is a third-party BSD-style license (Jaroslaw
Tuszynski, 2016) that was bundled in the original MATLAB export — it is **not**
a license for this project's own code and shouldn't be read as one. This repo
currently has no top-level LICENSE file; add one if you want to formally
license the new web app code.
