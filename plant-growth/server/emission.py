"""Light-source emission spectrum loading and combination.

Ports ``pushbutton1_Callback`` from the original MATLAB app: the user could
pick 1-4 emission spectrum text files, each gets linearly interpolated onto a
common wavelength grid (out-of-range = 0, matching MATLAB's
``interp1(..., 'linear', 0)``), individually normalized to a peak of 1.0, then
summed and renormalized to a peak of 1.0.

The bundled reference spectra in ``data/emission/`` are the real measurement
files that shipped with the original MATLAB project (rare-earth-doped glass
and LED emission scans). They are committed to the repo so the deployed app
always has real sample data available, without requiring every user to
re-upload their own files.
"""
import os

import numpy as np

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "emission"
)


def parse_xy_text(text):
    """Parse a whitespace/tab/comma-delimited 2-column numeric text file into
    sorted (wavelength, value) numpy arrays. Mirrors MATLAB's
    ``readtable``/``table2array`` for the plain 2-column spectra files used
    throughout this app. Non-numeric lines (e.g. a header row) are skipped."""
    xs, ys = [], []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.replace(",", " ").split()
        if len(parts) < 2:
            continue
        try:
            x, y = float(parts[0]), float(parts[1])
        except ValueError:
            continue
        xs.append(x)
        ys.append(y)
    if not xs:
        raise ValueError("No numeric (wavelength, value) rows found in file")
    xs = np.array(xs, dtype=float)
    ys = np.array(ys, dtype=float)
    order = np.argsort(xs)
    return xs[order], ys[order]


def _friendly_label(filename):
    name = os.path.splitext(filename)[0]
    return name.replace("_", " ").replace("-", " ").strip()


def list_library():
    """Bundled reference emission spectra shipped in data/emission/."""
    if not os.path.isdir(DATA_DIR):
        return []
    items = []
    for filename in sorted(os.listdir(DATA_DIR)):
        if filename.lower().endswith(".txt"):
            items.append({
                "id": filename,
                "filename": filename,
                "label": _friendly_label(filename),
            })
    return items


def load_library_curve(item_id):
    """Load a bundled spectrum by its exact filename (as returned by
    list_library). Rejects anything that isn't a plain filename already
    present in the library, to avoid path traversal."""
    valid_ids = {item["id"] for item in list_library()}
    if item_id not in valid_ids:
        raise ValueError(f"Unknown library spectrum: {item_id!r}")
    path = os.path.join(DATA_DIR, item_id)
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return parse_xy_text(f.read())


def combine_spectra_with_components(curves, wavelength_grid):
    """Combine 1-4 (wavelength, value) spectra onto ``wavelength_grid``,
    matching PlantSensitivityResponse3.m's pushbutton1_Callback. Returns
    (combined, components) where ``components`` is each input spectrum's own
    interpolated-and-peak-normalized curve, in input order, before summation
    - used to plot "individual vs. combined" in the report."""
    if not (1 <= len(curves) <= 4):
        raise ValueError("Provide between 1 and 4 emission spectra")
    components = []
    total = np.zeros_like(wavelength_grid)
    for xs, ys in curves:
        interp = np.interp(wavelength_grid, xs, ys, left=0.0, right=0.0)
        peak = np.max(interp)
        if peak > 0:
            interp = interp / peak
        components.append(interp)
        total += interp
    peak = np.max(total)
    if peak > 0:
        total = total / peak
    return total, components


def combine_spectra(curves, wavelength_grid):
    """Combine 1-4 (wavelength, value) spectra onto ``wavelength_grid``.
    Convenience wrapper around `combine_spectra_with_components` for callers
    that only need the final combined curve."""
    total, _components = combine_spectra_with_components(curves, wavelength_grid)
    return total
