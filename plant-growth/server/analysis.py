"""Core photosynthetic-overlap math, ported from
``pushbutton2_Callback`` in the original MATLAB app (see
legacy-matlab/PlantSensitivityResponse3.m).

All four metrics below are computed identically to the MATLAB source:

    raw_overlap_score   = trapz(wavelength, PL .* X)
    max_plant_area       = trapz(wavelength, X .* X)
    total_light_area     = trapz(wavelength, PL)
    net_growth_efficiency     = raw_overlap_score / total_light_area * 100
    normalized_overlap_score  = raw_overlap_score / max_plant_area   * 100
    DLI                  = PPFD * 3600 * photoperiod_hours / 1e6
    daily_biomass_yield  = alpha * (DLI * (net_growth_efficiency / 100)) / 100
"""
import numpy as np

# NumPy 2.0 renamed trapz() to trapezoid() and removed the old name in later
# releases; fall back for whichever is available so this works across the
# NumPy versions Replit/CI might install.
_trapz = getattr(np, "trapezoid", None) or getattr(np, "trapz")

# Fallback defaults used by the MATLAB GUI when a field was blank/missing.
DEFAULT_PPFD = 500.0
DEFAULT_PHOTOPERIOD_HOURS = 16.0
DEFAULT_ALPHA = 108.0


def compute_metrics(wavelength, pl, x, ppfd=DEFAULT_PPFD,
                     photoperiod_hours=DEFAULT_PHOTOPERIOD_HOURS,
                     alpha=DEFAULT_ALPHA):
    wavelength = np.asarray(wavelength, dtype=float)
    pl = np.asarray(pl, dtype=float)
    x = np.asarray(x, dtype=float)

    raw_overlap_score = float(_trapz(pl * x, wavelength))
    max_plant_area = float(_trapz(x * x, wavelength))
    total_light_area = float(_trapz(pl, wavelength))

    net_growth_efficiency = (raw_overlap_score / total_light_area * 100
                              if total_light_area else 0.0)
    normalized_overlap_score = (raw_overlap_score / max_plant_area * 100
                                 if max_plant_area else 0.0)

    dli = (ppfd * 3600 * photoperiod_hours) / 1_000_000
    daily_biomass_yield = alpha * (dli * (net_growth_efficiency / 100)) / 100

    return {
        "raw_overlap_score": raw_overlap_score,
        "max_plant_area": max_plant_area,
        "total_light_area": total_light_area,
        "net_growth_efficiency": net_growth_efficiency,
        "normalized_overlap_score": normalized_overlap_score,
        "dli": dli,
        "daily_biomass_yield": daily_biomass_yield,
    }
