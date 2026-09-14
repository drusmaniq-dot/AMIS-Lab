"""Plant Sensitivity Response - Flask web app.

A web port of the MATLAB/GUIDE desktop app in legacy-matlab/PlantSensitivityResponse3.m.
See README.md for the full mapping between the old GUI and this app, and for
what intentionally changed (a fixed interpolation bug, two corrected labels).
"""
import json
import os
from datetime import datetime

import numpy as np
from flask import Flask, jsonify, render_template, request, send_file
from werkzeug.middleware.proxy_fix import ProxyFix

from server import curves, emission, light_sources
from server.analysis import (
    DEFAULT_ALPHA,
    DEFAULT_PHOTOPERIOD_HOURS,
    DEFAULT_PPFD,
    compute_metrics,
)
from server.reports import generate_report

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB upload cap
# Without this, Flask caches the compiled template on first render and won't
# notice template edits until the process restarts (bit us once in dev).
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Lets url_for() emit paths prefixed correctly when this app is mounted under
# a subpath by a reverse proxy (AMIS Lab proxies it at /dashboard/services/
# plant-growth, sending X-Forwarded-Prefix). No effect when accessed directly
# (standalone deploy, local dev) since that header is simply absent then.
app.wsgi_app = ProxyFix(app.wsgi_app, x_prefix=1, x_proto=1, x_host=1)

# When this app is proxied (see AMIS Lab's app/dashboard/services/plant-growth
# route handler), the proxy is the only intended entry point. If
# PROXY_SHARED_SECRET is set, reject any request missing the matching header
# so the raw deployment URL can't be used to route around AMIS Lab's own
# sign-in + per-member service access checks. Unset (the default for
# standalone/local dev) this is a no-op.
_PROXY_SHARED_SECRET = os.environ.get("PROXY_SHARED_SECRET")


@app.before_request
def _require_proxy_secret():
    if _PROXY_SHARED_SECRET and request.headers.get("X-Internal-Proxy-Secret") != _PROXY_SHARED_SECRET:
        return "Forbidden", 403

DEFAULTS = {
    "ppfd": DEFAULT_PPFD,
    "photoperiod_hours": DEFAULT_PHOTOPERIOD_HOURS,
    "alpha": DEFAULT_ALPHA,
}


@app.route("/")
def index():
    return render_template(
        "index.html",
        emission_library=emission.list_library(),
        curve_options=curves.list_curves(),
        light_sources=light_sources.list_light_sources(),
        defaults=DEFAULTS,
    )


@app.route("/api/emission-library")
def api_emission_library():
    return jsonify(emission.list_library())


@app.route("/api/curves")
def api_curves():
    return jsonify(curves.list_curves())


def _read_emission_source(source, files):
    """source: {'type': 'library', 'id': <filename>} or
    {'type': 'upload', 'file_key': <multipart field name>}. Returns
    ((wavelength, value), label) - the label names which spectrum this was,
    for display in the Input Parameters table and the components chart."""
    source_type = source.get("type")
    if source_type == "library":
        item_id = source["id"]
        label = next(
            (item["label"] for item in emission.list_library() if item["id"] == item_id),
            item_id,
        )
        return emission.load_library_curve(item_id), label
    if source_type == "upload":
        f = files.get(source.get("file_key", ""))
        if f is None:
            raise ValueError("Missing uploaded emission file")
        label = f.filename or "Uploaded spectrum"
        return emission.parse_xy_text(f.read().decode("utf-8", errors="ignore")), label
    raise ValueError(f"Unknown emission source type: {source_type!r}")


@app.route("/api/combine-emission", methods=["POST"])
def api_combine_emission():
    try:
        sources = json.loads(request.form.get("sources", "[]"))
        if not sources:
            return jsonify({"error": "Provide at least one emission spectrum"}), 400
        curve_data, labels = [], []
        for s in sources:
            (xy, label) = _read_emission_source(s, request.files)
            curve_data.append(xy)
            labels.append(label)
        combined, components = emission.combine_spectra_with_components(curve_data, curves.WAVELENGTH_GRID)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({
        "wavelength": curves.WAVELENGTH_GRID.tolist(),
        "intensity": combined.tolist(),
        "components": [
            {"label": label, "intensity": component.tolist()}
            for label, component in zip(labels, components)
        ],
    })


def _load_custom_curve(request_files):
    f = request_files.get("custom_file")
    if f is None:
        raise ValueError("custom_file is required when target_curve is 'custom'")
    return emission.parse_xy_text(f.read().decode("utf-8", errors="ignore"))


def _run_analysis(payload, request_files):
    wavelength = curves.WAVELENGTH_GRID
    pl = np.array(payload["pl"]["intensity"], dtype=float)

    custom_xy = None
    if payload.get("target_curve") == curves.CUSTOM_CURVE_ID:
        custom_xy = _load_custom_curve(request_files)

    x, curve_label = curves.compute_target_curve(payload["target_curve"], wavelength, custom_xy)

    ppfd = float(payload.get("ppfd", DEFAULTS["ppfd"]))
    photoperiod_hours = float(payload.get("photoperiod_hours", DEFAULTS["photoperiod_hours"]))
    alpha = float(payload.get("alpha", DEFAULTS["alpha"]))

    metrics = compute_metrics(wavelength, pl, x, ppfd, photoperiod_hours, alpha)
    components = payload["pl"].get("components", [])
    return wavelength, pl, x, curve_label, metrics, ppfd, photoperiod_hours, alpha, components


@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    try:
        payload = json.loads(request.form.get("payload", "{}"))
        wavelength, pl, x, curve_label, metrics, *_ = _run_analysis(payload, request.files)
    except (ValueError, KeyError) as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({
        "wavelength": wavelength.tolist(),
        "pl": pl.tolist(),
        "x": x.tolist(),
        "curve_label": curve_label,
        "metrics": metrics,
    })


@app.route("/api/report", methods=["POST"])
def api_report():
    fmt = "png" if request.args.get("format") == "png" else "pdf"
    try:
        payload = json.loads(request.form.get("payload", "{}"))
        wavelength, pl, x, curve_label, metrics, ppfd, photoperiod_hours, alpha, components = _run_analysis(
            payload, request.files
        )
    except (ValueError, KeyError) as exc:
        return jsonify({"error": str(exc)}), 400

    emission_label = payload.get("emission_label") or "Emitted Spectrum"
    plant_name = payload.get("plant_name") or "Plant"
    buf = generate_report(
        wavelength, pl, x, metrics, curve_label, emission_label,
        ppfd, photoperiod_hours, alpha, components, fmt=fmt,
    )

    safe_name = "".join(c if c.isalnum() else "_" for c in plant_name)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"Analysis_Report_{safe_name}_{timestamp}.{fmt}"
    mimetype = "image/png" if fmt == "png" else "application/pdf"

    return send_file(buf, mimetype=mimetype, as_attachment=True, download_name=filename)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
