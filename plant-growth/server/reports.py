"""PDF/PNG report generation, ported from the "AUTOMATED SILENT PDF REPORT
EXPORT BLOCK" repeated after every plant branch in the original MATLAB file,
and later beautified per user request: a centered AMIS Lab logo header, a
faint logo watermark behind the chart, a detailed Blue/Green/Red region key,
centered Input Parameters / Results tables (including which spectra were
selected), and a second chart showing the individual emission spectra
alongside their combination.

Layout note: every position below is tracked in INCHES FROM THE TOP of the
page (via the `_y` helper) rather than raw figure-fraction constants. Table
height turns out to be independent of its containing axes' size - see
`_TABLE_ROW_HEIGHT_IN` - so this is what lets each section's position be
computed from the real rendered size of the section above it instead of
hand-tuned numbers that quietly break whenever a row is added or removed.
"""
import io
import os
from datetime import datetime

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

# Brand palette (kept in sync with static/css/style.css's :root tokens).
NAVY = "#16274f"
NAVY_LIGHT = "#2a4a8f"
ACCENT = "#2f7a4f"
MUTED = "#5b6b62"
BORDER = "#d8e2dc"
ROW_TINT = "#f0f6f1"

# Colors for up to 4 individual emission components on the second chart.
COMPONENT_COLORS = ["#e07b39", "#4c72b0", "#55a868", "#8172b2"]

REGION_BANDS = [
    # (low_nm, high_nm, fill_color, swatch_color, description)
    (400, 500, (0.8, 0.9, 1.0), "#7fa8e0",
     "drives compact vegetative growth & chlorophyll b absorption"),
    (500, 600, (0.8, 1.0, 0.8), "#7fcf9c",
     "least absorbed by chlorophyll; aids deeper canopy penetration"),
    (600, 700, (1.0, 0.8, 0.8), "#e07f7f",
     "peak chlorophyll a absorption; primary driver of photosynthesis"),
]

_LOGO_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "img", "logo.png"
)
_UNLOADED = object()  # sentinel, deliberately not None/a string: the cached
                       # value is a numpy array once loaded, and `array == "x"`
                       # returns an array (not a bool), which breaks a plain
                       # `if`. `is` comparison against this sentinel avoids
                       # ever triggering numpy's elementwise __eq__.
_logo_cache = _UNLOADED


def _load_logo():
    """Lazily loads and caches the AMIS Lab logo as an (H, W, C) array. Returns
    None (cached) if the file is missing, so a report can still be generated
    without a header image or watermark."""
    global _logo_cache
    if _logo_cache is _UNLOADED:
        try:
            _logo_cache = plt.imread(_LOGO_PATH)
        except Exception:
            _logo_cache = None
    return _logo_cache


def _y(fig, inches_from_top):
    """Convert a distance from the top of the page (inches) to a Matplotlib
    figure-fraction y-coordinate (0 at the bottom, 1 at the top)."""
    return 1 - inches_from_top / fig.get_size_inches()[1]


# Empirically measured (see git history for the measurement script): at
# fontsize=8/scale(1, 1.6), matplotlib's ax.table() sizes itself to this many
# inches per row (including the header row), independent of figure size or
# the containing axes' own height/width - the axes rect only controls where
# the table is centered, not how big it renders.
_TABLE_ROW_HEIGHT_IN = 4 / 15


def _table_height_in(n_rows_total):
    """How tall (inches) a table with this many rows (header included) will
    render, at the fontsize/scale `_styled_table` uses - see
    `_TABLE_ROW_HEIGHT_IN`. Used both for the upfront page-height plan and
    for actually placing the table, so the two can never drift apart."""
    return _TABLE_ROW_HEIGHT_IN * (n_rows_total + 1)


def _table_rect(fig, top_in, n_rows_total, width=0.64):
    """Rect (figure-fraction) for a table whose top sits `top_in` inches from
    the page top, centered horizontally."""
    height_in = _table_height_in(n_rows_total)
    fig_h = fig.get_size_inches()[1]
    left = (1 - width) / 2
    return (left, _y(fig, top_in + height_in), width, height_in / fig_h)


def _styled_table(fig, rect, col_labels, rows, col_widths):
    """A small navy-headed, banded-row table at figure-fraction `rect`
    (left, bottom, width, height) - see `_table_rect`. Centered and
    intentionally kept well short of the page's full width."""
    ax = fig.add_axes(rect)
    ax.axis("off")
    table = ax.table(cellText=rows, colLabels=col_labels, cellLoc="left",
                      colLoc="left", loc="center", colWidths=col_widths)
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1, 1.6)
    for (row, _col), cell in table.get_celld().items():
        cell.set_edgecolor(BORDER)
        if row == 0:
            cell.set_facecolor(NAVY)
            cell.get_text().set_color("white")
            cell.get_text().set_fontweight("bold")
        else:
            cell.set_facecolor(ROW_TINT if row % 2 == 0 else "white")
    return ax


def _add_watermark(fig, ax, logo, height_frac=0.62, alpha=0.06):
    """Places `logo` centered in `ax`, faint and behind the data (zorder=0),
    sized as a fraction of the axes' own height while preserving the logo's
    pixel aspect ratio (so it isn't stretched)."""
    if logo is None:
        return
    bbox = ax.get_position()
    fig_w, fig_h = fig.get_size_inches()
    ax_w_in, ax_h_in = bbox.width * fig_w, bbox.height * fig_h
    img_aspect = logo.shape[1] / logo.shape[0]  # width / height

    h_frac = height_frac
    w_frac = (h_frac * ax_h_in * img_aspect) / ax_w_in
    x0, x1 = 0.5 - w_frac / 2, 0.5 + w_frac / 2
    y0, y1 = 0.5 - h_frac / 2, 0.5 + h_frac / 2
    ax.imshow(logo, extent=(x0, x1, y0, y1), transform=ax.transAxes,
              alpha=alpha, zorder=0, interpolation="bilinear", aspect="auto")


def _add_header(fig, logo, top_in=0.35, height_in=0.9):
    """Just the AMIS Lab logo, centered - no strip, no text (the wordmark and
    tagline are already baked into the logo image itself). Returns the
    inches-from-top of the divider line beneath it."""
    bottom_in = top_in + height_in
    if logo is not None:
        img_aspect = logo.shape[1] / logo.shape[0]
        fig_w, fig_h = fig.get_size_inches()
        w_frac = (height_in * img_aspect) / fig_w
        logo_ax = fig.add_axes(((1 - w_frac) / 2, _y(fig, bottom_in), w_frac, height_in / fig_h))
        logo_ax.imshow(logo)
        logo_ax.axis("off")
    divider_in = bottom_in + 0.1
    fig.add_artist(plt.Line2D([0.07, 0.94], [_y(fig, divider_in)] * 2,
                               transform=fig.transFigure, color=BORDER, linewidth=1))
    return divider_in


def _add_region_key(fig, top_in, row_h_in=0.19):
    """Detailed Blue/Green/Red region legend, drawn as color swatches with
    a description each - too much text to fit cleanly inside a line legend,
    so it gets its own block."""
    for i, (lo, hi, _fill, swatch, note) in enumerate(REGION_BANDS):
        y_in = top_in + i * row_h_in
        y = _y(fig, y_in)
        fig.add_artist(Rectangle((0.13, y - 0.006), 0.012, 0.012,
                                  transform=fig.transFigure, facecolor=swatch, edgecolor="none"))
        label = ["Blue", "Green", "Red"][i]
        fig.text(0.15, y, f"{label} region ({lo}–{hi} nm) — {note}",
                  fontsize=7.5, va="center", color="#333333")


def _inset_axes(fig, top_in, height_in, left=0.15, width=0.72):
    """An axes `height_in` inches tall with its top `top_in` inches from the
    page top, inset from the page's left/right edges (not edge-to-edge)."""
    fig_h = fig.get_size_inches()[1]
    return fig.add_axes((left, _y(fig, top_in + height_in), width, height_in / fig_h))


def generate_report(wavelength, pl, x, metrics, curve_label, emission_label,
                     ppfd, photoperiod_hours, alpha, components=None, fmt="pdf"):
    """Returns a BytesIO buffer containing the report in the requested
    format ('pdf' or 'png'). `components` is an optional list of
    {"label": str, "intensity": [...]} for each emission spectrum that went
    into `pl` before combination (see server/emission.py), used to draw the
    "individual vs. combined" chart."""
    components = components or []
    logo = _load_logo()

    # Every position in this report is planned in inches-from-top (`_y`
    # converts to a figure-fraction at render time). That arithmetic doesn't
    # depend on the figure's actual size, EXCEPT the figure has to be created
    # at the right size *before* placing anything: figure-fraction positions
    # don't stay pinned to an absolute inch position if the canvas is resized
    # afterwards (font sizes are fixed in points, so a post-hoc resize would
    # shift the spacing those font sizes were tuned for). So the exact
    # vertical plan is computed first, in plain arithmetic, and the figure is
    # created at that final height - one page, sized to its own content, no
    # separate "trim" pass.
    header_bottom_in = 0.35 + 0.9  # header top + logo height
    divider_in = header_bottom_in + 0.1
    title_in = divider_in + 0.3
    subtitle_in = title_in + 0.2
    input_heading_in = subtitle_in + 0.35
    input_table_top_in = input_heading_in + 0.2
    input_n_rows_total = 7  # 6 data rows + 1 header row
    input_bottom_in = input_table_top_in + _table_height_in(input_n_rows_total)
    spectra_heading_in = input_bottom_in + 0.35
    spectra_chart_top_in = spectra_heading_in + 0.2
    spectra_chart_h = 2.5
    spectra_bottom_in = spectra_chart_top_in + spectra_chart_h
    overlap_heading_in = spectra_bottom_in + 0.55
    overlap_chart_top_in = overlap_heading_in + 0.2
    overlap_chart_h = 2.5
    overlap_bottom_in = overlap_chart_top_in + overlap_chart_h
    region_key_top_in = overlap_bottom_in + 0.5
    region_key_row_h_in = 0.19
    region_key_bottom_in = region_key_top_in + len(REGION_BANDS) * region_key_row_h_in
    results_heading_in = region_key_bottom_in + 0.3
    results_table_top_in = results_heading_in + 0.2
    results_n_rows_total = 5  # 4 data rows + 1 header row
    results_bottom_in = results_table_top_in + _table_height_in(results_n_rows_total)
    footer_in = results_bottom_in + 0.3
    total_height_in = footer_in + 0.3

    fig = plt.figure(figsize=(8.5, total_height_in), facecolor="white")

    _add_header(fig, logo)

    fig.text(0.5, _y(fig, title_in), "Photosynthetic Overlap & Yield Summary Report",
              ha="center", fontsize=13, fontweight="bold")
    fig.text(0.5, _y(fig, subtitle_in),
              f"Generated automatically on: {datetime.now():%Y-%m-%d %H:%M:%S}",
              ha="center", fontsize=8, color=MUTED)

    # --- Input Parameters (centered, shown before either chart) - rows in
    # the same order as the UI's 4 steps: plant curve, light source,
    # spectrum selection, then the growth parameters. ---
    fig.text(0.5, _y(fig, input_heading_in), "Input Parameters", ha="center",
              fontsize=10, fontweight="bold", color=NAVY)
    spectrum_names = ", ".join(c.get("label", "?") for c in components) or "—"
    input_rows = [
        ["Target plant / curve", curve_label],
        ["Light source", emission_label],
        ["Spectrum source(s)", spectrum_names],
        ["PPFD", f"{ppfd:.1f} µmol/m²/s"],
        ["Photoperiod", f"{photoperiod_hours:.1f} hours"],
        ["Alpha (crop coefficient)", f"{alpha:.1f}"],
    ]
    assert len(input_rows) + 1 == input_n_rows_total
    input_rect = _table_rect(fig, input_table_top_in, input_n_rows_total)
    _styled_table(fig, input_rect, ["Parameter", "Value"], input_rows,
                  col_widths=[0.36, 0.64])

    # --- Chart 1: individual emission spectra + their combination ---
    fig.text(0.5, _y(fig, spectra_heading_in), "Emission Spectra — Individual & Combined",
              ha="center", fontsize=10, fontweight="bold", color=NAVY)
    ax_spectra = _inset_axes(fig, spectra_chart_top_in, spectra_chart_h)
    if components:
        for i, comp in enumerate(components):
            color = COMPONENT_COLORS[i % len(COMPONENT_COLORS)]
            ax_spectra.plot(wavelength, comp["intensity"], color=color, linewidth=1.2,
                             label=comp.get("label", f"Spectrum {i + 1}"), zorder=2)
    ax_spectra.plot(wavelength, pl, color=NAVY, linewidth=2.0, label="Combined", zorder=3)
    ax_spectra.set_xlabel("Wavelength (nm)", fontsize=9, fontweight="bold")
    ax_spectra.set_ylabel("Normalized Intensity", fontsize=9, fontweight="bold")
    ax_spectra.set_xlim(wavelength[0], wavelength[-1])
    ax_spectra.set_ylim(0, 1.15)
    ax_spectra.tick_params(labelsize=7.5)
    ax_spectra.grid(True, alpha=0.4, zorder=0)
    ax_spectra.legend(loc="upper right", fontsize=6.5, framealpha=0.9)

    # --- Chart 2: overlap of the combined spectrum against the target curve,
    # with a faint logo watermark behind the curves. ---
    fig.text(0.5, _y(fig, overlap_heading_in), "Photosynthetic Overlap",
              ha="center", fontsize=10, fontweight="bold", color=NAVY)
    ax = _inset_axes(fig, overlap_chart_top_in, overlap_chart_h)
    _add_watermark(fig, ax, logo)
    for lo, hi, fill, _swatch, _note in REGION_BANDS:
        ax.add_patch(Rectangle((lo, 0), hi - lo, 1.2, facecolor=fill,
                                edgecolor="none", alpha=0.35, zorder=1))
    ax.plot(wavelength, pl, color="#c0392b", linewidth=1.6, label=emission_label, zorder=3)
    ax.plot(wavelength, x, color="#2c5aa0", linestyle="--", linewidth=1.3,
             label=curve_label, zorder=3)
    ax.set_xlabel("Wavelength (nm)", fontsize=9, fontweight="bold")
    ax.set_ylabel("Normalized Scale / Sensitivity", fontsize=9, fontweight="bold")
    ax.set_xlim(wavelength[0], wavelength[-1])
    ax.set_ylim(0, 1.2)
    ax.tick_params(labelsize=7.5)
    ax.grid(True, alpha=0.4, zorder=0)
    ax.legend(loc="upper right", fontsize=7, framealpha=0.9)

    _add_region_key(fig, region_key_top_in, row_h_in=region_key_row_h_in)

    # --- Results ---
    fig.text(0.5, _y(fig, results_heading_in), "Results", ha="center",
              fontsize=10, fontweight="bold", color=NAVY)
    result_rows = [
        ["Daily Light Integral (DLI)", f"{metrics['dli']:.2f} mol/m²/day"],
        ["Net Plant Growth Efficiency", f"{metrics['net_growth_efficiency']:.2f} %"],
        ["Photosynthetic Overlap Score", f"{metrics['normalized_overlap_score']:.2f} %"],
        ["Predicted Daily Biomass Yield", f"{metrics['daily_biomass_yield']:.2f} g/m²/day"],
    ]
    assert len(result_rows) + 1 == results_n_rows_total
    results_rect = _table_rect(fig, results_table_top_in, results_n_rows_total)
    _styled_table(fig, results_rect, ["Metric", "Value"], result_rows,
                  col_widths=[0.6, 0.4])

    fig.text(0.5, _y(fig, footer_in), "AMIS Lab — Plant Sensitivity Response GUI",
              ha="center", fontsize=7, color=MUTED)

    buf = io.BytesIO()
    if fmt == "png":
        fig.savefig(buf, format="png", dpi=300)
    else:
        fig.savefig(buf, format="pdf")
    plt.close(fig)
    buf.seek(0)
    return buf
