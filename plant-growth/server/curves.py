"""Target "plant sensitivity" curve definitions.

This is a faithful port of the 17 branches in the original MATLAB GUI callback
``pushbutton2_Callback`` (see legacy-matlab/PlantSensitivityResponse3.m,
around lines 270-3330), where the user's popupmenu1 selection picked one of:

  - 12 curves built from a sum of Gaussian terms (StandardPlant/McCree, VINCA,
    Rosemary, Lavender, Saffron, AloeVera, Jasmine, Sweet Corn, Strawberry,
    Pineapple, Cucumber, Tomato) — each term is (amplitude, center_nm, sigma_nm).
  - 4 curves built from literal plant-pigment absorption data points, smoothed
    with PCHIP (piecewise cubic Hermite) interpolation, matching MATLAB's
    ``pchip`` (Chlorophyll a, Chlorophyll b, Phytochrome Pr, Phytochrome Pfr).
  - 1 "Select.File" option where the user supplies their own 2-column
    (wavelength, value) text file.

Known bug fixed here (see README "Differences from the original MATLAB app"):
the original code built the pigment curves on a 0.5 nm-step query array
(``w_query``) and then sliced it *positionally* (``y_chla(1:n)``) instead of
interpolating it onto the actual analysis wavelength grid. That silently used
the wrong wavelength axis for those 4 curves. Here every curve is evaluated
directly on ``WAVELENGTH_GRID``, which is the correct behavior.
"""
import numpy as np
from scipy.interpolate import PchipInterpolator

# Matches MATLAB's `wavelength_grid = (350:1:800)'`
WAVELENGTH_MIN = 350
WAVELENGTH_MAX = 800
WAVELENGTH_GRID = np.arange(WAVELENGTH_MIN, WAVELENGTH_MAX + 1, 1, dtype=float)


def _gaussian(w, amplitude, center, sigma):
    return amplitude * np.exp(-((w - center) ** 2) / (2 * sigma ** 2))


def _sum_gaussians(w, terms):
    total = np.zeros_like(w)
    for amplitude, center, sigma in terms:
        total += _gaussian(w, amplitude, center, sigma)
    return total


# Each entry: label shown in the UI/reports, and (amplitude, center_nm, sigma_nm)
# terms exactly as hardcoded in the corresponding MATLAB branch.
GAUSSIAN_CURVES = {
    "standard_plant": {
        "label": "Standard Plant Sensitivity Curve (McCree)",
        "terms": [(0.75, 440, 25), (0.2, 550, 40), (1.0, 660, 25)],
    },
    "vinca": {
        "label": "Vinca (UV/Blue-favoring alkaloid profile)",
        "terms": [(0.85, 430, 20), (0.55, 545, 35), (1.0, 665, 22)],
    },
    "rosemary": {
        "label": "Rosemary (essential oil / biomass profile)",
        "terms": [(0.95, 450, 25), (0.40, 550, 40), (1.0, 660, 20), (0.30, 730, 15)],
    },
    "lavender": {
        "label": "Lavender (aromatic terpene profile)",
        "terms": [(0.35, 380, 15), (1.0, 450, 25), (0.45, 555, 35), (0.90, 660, 20), (0.25, 735, 10)],
    },
    "saffron": {
        "label": "Saffron (Crocus flowering profile)",
        "terms": [(0.6, 450, 20), (0.3, 560, 40), (1.0, 660, 25), (0.4, 730, 15)],
    },
    "aloe_vera": {
        "label": "Aloe Vera (succulent profile)",
        "terms": [(0.85, 435, 22), (0.12, 550, 45), (1.00, 665, 28)],
    },
    "jasmine": {
        "label": "Jasmine (flowering profile)",
        "terms": [(0.90, 440, 24), (0.16, 545, 40), (1.00, 660, 26)],
    },
    "sweet_corn": {
        "label": "Sweet Corn (C4 photosynthetic profile)",
        "terms": [(0.78, 450, 22), (0.45, 550, 45), (1.00, 660, 25)],
    },
    "strawberry": {
        "label": "Strawberry (flowering/fruiting profile)",
        "terms": [(0.82, 450, 22), (0.28, 540, 38), (1.00, 660, 25)],
    },
    "pineapple": {
        "label": "Pineapple (tropical CAM profile)",
        "terms": [(0.88, 445, 23), (0.18, 545, 42), (1.00, 660, 26)],
    },
    "cucumber": {
        "label": "Cucumber (dense broad-leaf C3 profile)",
        "terms": [(0.85, 450, 22), (0.42, 550, 45), (1.00, 660, 25)],
    },
    "tomato": {
        "label": "Tomato (dense fruiting C3 canopy)",
        "terms": [(0.84, 450, 22), (0.38, 550, 44), (1.00, 660, 25)],
    },
}

# Absorption spectra of plant pigments, digitized from published data:
# Yang C, Liu W, You Q, Zhao X, Liu S, Xue L, Sun J, Jiang X. "Recent Advances
# in Light-Conversion Phosphors for Plant Growth and Strategies for the
# Modulation of Photoluminescence Properties." Nanomaterials (Basel).
# 2023 May 23;13(11):1715. doi: 10.3390/nano13111715. PMID: 37299618.
PIGMENT_TABLES = {
    "chlorophyll_a": {
        "label": "Chlorophyll a absorption spectrum",
        "points": [
            (390, 0.08), (410, 0.22), (430, 0.54), (445, 0.47), (460, 0.98),
            (470, 0.40), (480, 0.12), (500, 0.05), (520, 0.08), (540, 0.07),
            (570, 0.09), (600, 0.06), (620, 0.15), (645, 0.10), (665, 0.73),
            (680, 0.25), (700, 0.01),
        ],
        "domain": (390, 700),
    },
    "chlorophyll_b": {
        "label": "Chlorophyll b absorption spectrum",
        "points": [
            (390, 0.15), (415, 0.40), (435, 0.51), (455, 0.94), (465, 0.96),
            (475, 0.20), (490, 0.03), (520, 0.04), (550, 0.03), (590, 0.08),
            (615, 0.60), (635, 0.18), (655, 0.06), (680, 0.01),
        ],
        "domain": (390, 680),
    },
    "pigment_pr": {
        "label": "Phytochrome Pr absorption spectrum",
        "points": [
            (350, 0.23), (375, 0.31), (400, 0.20), (425, 0.07), (450, 0.02),
            (500, 0.01), (550, 0.08), (600, 0.32), (635, 0.68), (666, 1.00),
            (685, 0.58), (700, 0.18), (730, 0.04), (760, 0.02), (800, 0.01),
        ],
        "domain": None,
    },
    "pigment_pfr": {
        "label": "Phytochrome Pfr absorption spectrum",
        "points": [
            (350, 0.09), (380, 0.22), (405, 0.26), (435, 0.15), (470, 0.04),
            (520, 0.01), (570, 0.03), (620, 0.11), (660, 0.31), (680, 0.44),
            (710, 0.46), (735, 0.65), (760, 0.35), (780, 0.11), (800, 0.02),
        ],
        "domain": None,
    },
}

CUSTOM_CURVE_ID = "custom"

CURVE_ORDER = [
    "standard_plant", "vinca", "rosemary", "lavender", "saffron", "aloe_vera",
    "jasmine", "sweet_corn", "strawberry", "pineapple", "cucumber", "tomato",
    "chlorophyll_a", "chlorophyll_b", "pigment_pr", "pigment_pfr",
    CUSTOM_CURVE_ID,
]


def list_curves():
    """Options for the "target curve" dropdown, in the same order as the
    original popupmenu1."""
    items = []
    for curve_id in CURVE_ORDER:
        if curve_id == CUSTOM_CURVE_ID:
            label = "Upload my own curve (.txt, 2 columns: wavelength, value)"
        elif curve_id in GAUSSIAN_CURVES:
            label = GAUSSIAN_CURVES[curve_id]["label"]
        else:
            label = PIGMENT_TABLES[curve_id]["label"]
        items.append({"id": curve_id, "label": label})
    return items


def compute_target_curve(curve_id, wavelength_grid=WAVELENGTH_GRID, custom_xy=None):
    """Return (values, label) for the requested target curve on
    ``wavelength_grid``, matching the original MATLAB math (with the pigment
    interpolation bug fixed - see module docstring)."""
    if curve_id in GAUSSIAN_CURVES:
        cfg = GAUSSIAN_CURVES[curve_id]
        values = _sum_gaussians(wavelength_grid, cfg["terms"])
        peak = np.max(values)
        if peak > 0:
            values = values / peak
        return values, cfg["label"]

    if curve_id in PIGMENT_TABLES:
        cfg = PIGMENT_TABLES[curve_id]
        xs = np.array([p[0] for p in cfg["points"]], dtype=float)
        ys = np.array([p[1] for p in cfg["points"]], dtype=float)
        interpolator = PchipInterpolator(xs, ys, extrapolate=True)
        values = interpolator(wavelength_grid)
        if cfg["domain"] is not None:
            lo, hi = cfg["domain"]
            values = np.where((wavelength_grid < lo) | (wavelength_grid > hi), 0.0, values)
        return values, cfg["label"]

    if curve_id == CUSTOM_CURVE_ID:
        if custom_xy is None:
            raise ValueError("custom_curve data is required when target_curve is 'custom'")
        xs, ys = custom_xy
        values = np.interp(wavelength_grid, xs, ys, left=0.0, right=0.0)
        peak = np.max(values)
        if peak > 0:
            values = values / peak
        return values, "Uploaded Plant Sensitivity Curve"

    raise ValueError(f"Unknown target curve id: {curve_id!r}")
