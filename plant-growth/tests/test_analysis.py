"""Sanity checks for the ported math. These aren't a full regression suite
against the original MATLAB outputs (no MATLAB runtime available here), but
they pin down the mathematical properties the port must preserve.
"""
import numpy as np
import pytest

from server import curves, emission
from server.analysis import compute_metrics


def test_gaussian_curve_peaks_at_one():
    for curve_id in curves.GAUSSIAN_CURVES:
        values, label = curves.compute_target_curve(curve_id)
        assert values.shape == curves.WAVELENGTH_GRID.shape
        assert np.isclose(values.max(), 1.0)
        assert label  # every curve has a non-empty display label


def test_pigment_curve_is_zero_outside_its_domain():
    values, _ = curves.compute_target_curve("chlorophyll_a")
    below_domain = curves.WAVELENGTH_GRID < 390
    above_domain = curves.WAVELENGTH_GRID > 700
    assert np.all(values[below_domain] == 0)
    assert np.all(values[above_domain] == 0)
    assert values.max() > 0


def test_pigment_pr_pfr_have_no_extra_clamping():
    # pr/pfr cover the full analysis grid (350-800 nm) in the original data,
    # so no domain clamp is applied (matches the MATLAB source).
    values, _ = curves.compute_target_curve("pigment_pr")
    assert values.shape == curves.WAVELENGTH_GRID.shape


def test_custom_curve_normalizes_and_zero_fills_outside_range():
    xs = np.array([400.0, 500.0, 600.0])
    ys = np.array([0.0, 50.0, 0.0])
    values, label = curves.compute_target_curve("custom", custom_xy=(xs, ys))
    assert np.isclose(values.max(), 1.0)
    assert values[curves.WAVELENGTH_GRID < 400].sum() == 0
    assert values[curves.WAVELENGTH_GRID > 600].sum() == 0
    assert "Uploaded" in label


def test_unknown_curve_id_raises():
    with pytest.raises(ValueError):
        curves.compute_target_curve("not-a-real-curve")


def test_perfect_overlap_yields_100_percent_normalized_score():
    # If the light source exactly matches the target curve shape, the
    # normalized overlap score (raw_overlap_score / max_plant_area * 100)
    # must be 100%, per the original MATLAB comment describing max_plant_area
    # as "a hypothetical light source that perfectly mimics the plant curve".
    wavelength = curves.WAVELENGTH_GRID
    x, _ = curves.compute_target_curve("standard_plant")
    metrics = compute_metrics(wavelength, pl=x, x=x, ppfd=500, photoperiod_hours=16, alpha=108)
    assert np.isclose(metrics["normalized_overlap_score"], 100.0, atol=1e-6)


def test_dli_and_yield_formula():
    wavelength = curves.WAVELENGTH_GRID
    x, _ = curves.compute_target_curve("standard_plant")
    metrics = compute_metrics(wavelength, pl=x, x=x, ppfd=500, photoperiod_hours=16, alpha=108)
    expected_dli = (500 * 3600 * 16) / 1_000_000
    assert np.isclose(metrics["dli"], expected_dli)
    expected_yield = 108 * (expected_dli * (metrics["net_growth_efficiency"] / 100)) / 100
    assert np.isclose(metrics["daily_biomass_yield"], expected_yield)


def test_combine_single_spectrum_normalizes_to_peak_one():
    xs = np.array([400.0, 450.0, 500.0])
    ys = np.array([0.0, 10.0, 0.0])
    combined = emission.combine_spectra([(xs, ys)], curves.WAVELENGTH_GRID)
    assert np.isclose(combined.max(), 1.0)


def test_combine_multiple_spectra_sums_normalized_peaks():
    grid = curves.WAVELENGTH_GRID
    xs1 = np.array([400.0, 450.0, 500.0])
    ys1 = np.array([0.0, 10.0, 0.0])
    xs2 = np.array([600.0, 650.0, 700.0])
    ys2 = np.array([0.0, 20.0, 0.0])
    combined = emission.combine_spectra([(xs1, ys1), (xs2, ys2)], grid)
    assert np.isclose(combined.max(), 1.0)
    # Two well-separated peaks should each still reach (approximately) full
    # height after the final renormalization, since neither overlaps the other.
    assert combined[np.argmin(np.abs(grid - 450))] > 0.9
    assert combined[np.argmin(np.abs(grid - 650))] > 0.9


def test_combine_rejects_too_many_or_too_few_spectra():
    xs = np.array([400.0, 450.0, 500.0])
    ys = np.array([0.0, 10.0, 0.0])
    with pytest.raises(ValueError):
        emission.combine_spectra([], curves.WAVELENGTH_GRID)
    with pytest.raises(ValueError):
        emission.combine_spectra([(xs, ys)] * 5, curves.WAVELENGTH_GRID)


def test_parse_xy_text_skips_header_and_sorts():
    text = "wavelength value\n500 1.0\n400 2.0\n450 3.0\n"
    xs, ys = emission.parse_xy_text(text)
    assert list(xs) == [400.0, 450.0, 500.0]
    assert list(ys) == [2.0, 3.0, 1.0]


def test_library_lookup_rejects_unknown_or_traversal_ids():
    with pytest.raises(ValueError):
        emission.load_library_curve("../../etc/passwd")
    with pytest.raises(ValueError):
        emission.load_library_curve("not_a_real_file.txt")
