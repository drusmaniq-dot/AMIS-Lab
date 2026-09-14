"""Light-source "doped material" labels, ported from popupmenu2 /
pushbutton2_Callback in the original MATLAB app.

These are purely cosmetic: MATLAB used this dropdown only to build a display
label (``GEmission``) for the chart legend and report title - it never
filtered which spectrum files could be loaded. Labels are shortened (no
"Emission of"/"Emission due to" prefix) and tagged with the periodic-table
symbol per the user's request; two are also corrected versus the original
source (see comments below).
"""

LIGHT_SOURCE_LABELS = {
    "Er": "Glass doped with Erbium (Er)",
    "Tm": "Glass doped with Thulium (Tm)",
    "Pr": "Glass doped with Praseodymium (Pr)",
    "Sm": "Glass doped with Samarium (Sm)",
    "Eu": "Glass doped with Europium (Eu)",
    "Tb": "Glass doped with Terbium (Tb)",
    # Original MATLAB swapped these two labels (SmTm said "Samarium-Europium"
    # and SmEu said "Samarium-Thulium"); corrected to match the material keys.
    "SmTm": "Glass Co-doped with Samarium-Thulium (Sm-Tm)",
    "SmEu": "Glass Co-doped with Samarium-Europium (Sm-Eu)",
    "SmTmNd": "Glass Co-doped with Samarium-Thulium-Neodymium (Sm-Tm-Nd)",
    # Original MATLAB copy-pasted the SmTmNd label here too (said Neodymium);
    # corrected to Terbium to match the material key.
    "SmTmTb": "Glass Co-doped with Samarium-Thulium-Terbium (Sm-Tm-Tb)",
    "Co": "Cobalt (Co)",
    "Cr": "Chromium (Cr)",
    "Ni": "Nickel (Ni)",
    "Fe": "Iron (Fe)",
    "Ag": "Silver (Ag)",
}

LIGHT_SOURCE_ORDER = [
    "Er", "Tm", "Pr", "Sm", "Eu", "Tb", "SmTm", "SmEu", "SmTmNd", "SmTmTb",
    "Co", "Cr", "Ni", "Fe", "Ag",
]


def list_light_sources():
    return [{"id": key, "label": LIGHT_SOURCE_LABELS[key]} for key in LIGHT_SOURCE_ORDER]


def label_for(key, default="Emitted Spectrum"):
    return LIGHT_SOURCE_LABELS.get(key, default)
