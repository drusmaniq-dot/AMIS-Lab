(function () {
  "use strict";

  const bootstrap = JSON.parse(document.getElementById("bootstrap-data").textContent);
  const BASE = bootstrap.basePath || "";
  const MAX_SLOTS = 4;

  const REGION_BANDS = [
    { from: 400, to: 500, color: "rgba(204, 224, 255, 0.35)" },
    { from: 500, to: 600, color: "rgba(204, 255, 204, 0.35)" },
    { from: 600, to: 700, color: "rgba(255, 204, 204, 0.35)" },
  ];

  const regionBandsPlugin = {
    id: "regionBands",
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      const xScale = scales.x;
      ctx.save();
      for (const band of REGION_BANDS) {
        const left = xScale.getPixelForValue(band.from);
        const right = xScale.getPixelForValue(band.to);
        ctx.fillStyle = band.color;
        ctx.fillRect(left, chartArea.top, right - left, chartArea.bottom - chartArea.top);
      }
      ctx.restore();
    },
  };

  let slotCount = 0;
  let lastAnalysis = null; // last successful /api/analyze payload+result, for report download
  let resultsChart = null;

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === "text") node.textContent = value;
      else node.setAttribute(key, value);
    });
    (children || []).forEach((child) => node.appendChild(child));
    return node;
  }

  function populateSelect(select, options, { valueKey = "id", labelKey = "label" } = {}) {
    select.innerHTML = "";
    options.forEach((opt) => {
      const optionEl = el("option", { value: opt[valueKey], text: opt[labelKey] });
      select.appendChild(optionEl);
    });
  }

  // ---------- Light source + target curve dropdowns ----------

  const lightSourceSelect = document.getElementById("light-source-select");
  populateSelect(lightSourceSelect, bootstrap.lightSources);

  const curveSelect = document.getElementById("curve-select");
  populateSelect(curveSelect, bootstrap.curveOptions);
  const customCurveUpload = document.getElementById("custom-curve-upload");
  curveSelect.addEventListener("change", () => {
    customCurveUpload.hidden = curveSelect.value !== "custom";
  });

  // ---------- Emission spectrum slots ----------

  const slotsContainer = document.getElementById("emission-slots");
  const addSlotBtn = document.getElementById("add-slot-btn");

  function buildSlot(index) {
    const wrapper = el("div", { class: "emission-slot", "data-slot-index": index });

    const typeSelect = el("select", { class: "slot-type" }, [
      el("option", { value: "library", text: "From library" }),
      el("option", { value: "upload", text: "Upload file" }),
    ]);

    const librarySelect = el("select", { class: "slot-library" });
    populateSelect(librarySelect, bootstrap.emissionLibrary, { valueKey: "id", labelKey: "label" });

    const fileInput = el("input", { class: "slot-file", type: "file", accept: ".txt,.csv", hidden: "true" });

    const fields = el("div", { class: "slot-fields" }, [
      el("label", { text: `Spectrum ${index + 1}` }),
      typeSelect,
      librarySelect,
      fileInput,
    ]);

    typeSelect.addEventListener("change", () => {
      const useUpload = typeSelect.value === "upload";
      librarySelect.hidden = useUpload;
      fileInput.hidden = !useUpload;
    });

    const removeBtn = el("button", { type: "button", class: "remove-slot-btn", text: "Remove" });
    removeBtn.addEventListener("click", () => {
      wrapper.remove();
      updateAddButtonState();
    });

    wrapper.appendChild(fields);
    if (slotsContainer.children.length > 0) {
      wrapper.appendChild(removeBtn);
    }
    return wrapper;
  }

  function updateAddButtonState() {
    const count = slotsContainer.children.length;
    addSlotBtn.disabled = count >= MAX_SLOTS;
    addSlotBtn.textContent = count >= MAX_SLOTS
      ? "Maximum of 4 spectra reached"
      : "+ Add another spectrum";
  }

  function addSlot() {
    if (slotsContainer.children.length >= MAX_SLOTS) return;
    slotsContainer.appendChild(buildSlot(slotCount));
    slotCount += 1;
    updateAddButtonState();
  }

  addSlotBtn.addEventListener("click", addSlot);
  addSlot(); // start with one slot

  // ---------- API helpers ----------

  async function postForm(url, formData) {
    const response = await fetch(url, { method: "POST", body: formData });
    let body;
    try {
      body = await response.json();
    } catch (err) {
      throw new Error(`Unexpected response from ${url} (${response.status})`);
    }
    if (!response.ok) {
      throw new Error(body.error || `Request to ${url} failed (${response.status})`);
    }
    return body;
  }

  function showError(node, message) {
    if (!message) {
      node.hidden = true;
      node.textContent = "";
      return;
    }
    node.hidden = false;
    node.textContent = message;
  }

  // ---------- Combine emission spectra (runs as part of Calculate) ----------

  function collectEmissionSources() {
    const slots = Array.from(slotsContainer.querySelectorAll(".emission-slot"));
    if (slots.length === 0) {
      throw new Error("Select at least one emission spectrum (step 2).");
    }

    const sources = [];
    const formData = new FormData();
    let uploadCount = 0;

    for (const slot of slots) {
      const type = slot.querySelector(".slot-type").value;
      if (type === "library") {
        const id = slot.querySelector(".slot-library").value;
        sources.push({ type: "library", id });
      } else {
        const fileInput = slot.querySelector(".slot-file");
        const file = fileInput.files[0];
        if (!file) {
          throw new Error("Choose a file for every 'Upload file' spectrum, or switch it to 'From library'.");
        }
        const fileKey = `file${uploadCount}`;
        uploadCount += 1;
        formData.append(fileKey, file);
        sources.push({ type: "upload", file_key: fileKey });
      }
    }

    formData.append("sources", JSON.stringify(sources));
    return formData;
  }

  async function combineEmission() {
    const formData = collectEmissionSources();
    const result = await postForm(`${BASE}/api/combine-emission`, formData);
    // `components` (each source spectrum's own normalized curve + label,
    // before summation) rides along in the payload purely so the PDF/PNG
    // report can plot "individual vs. combined" - the analyze/report routes
    // otherwise only care about `intensity` (the combined curve).
    return { wavelength: result.wavelength, intensity: result.intensity, components: result.components };
  }

  // ---------- Calculate ----------

  const calculateBtn = document.getElementById("calculate-btn");
  const analyzeErrorEl = document.getElementById("analyze-error");
  const resultsCard = document.getElementById("results-card");

  calculateBtn.addEventListener("click", async () => {
    showError(analyzeErrorEl, null);
    calculateBtn.disabled = true;
    calculateBtn.textContent = "Calculating…";

    let combinedPL;
    try {
      combinedPL = await combineEmission();
    } catch (err) {
      showError(analyzeErrorEl, err.message);
      calculateBtn.disabled = false;
      calculateBtn.textContent = "Calculate";
      return;
    }

    const targetCurve = curveSelect.value;
    const formData = new FormData();
    const payload = {
      pl: combinedPL,
      target_curve: targetCurve,
      emission_label: lightSourceSelect.options[lightSourceSelect.selectedIndex].text,
      ppfd: parseFloat(document.getElementById("ppfd-input").value) || bootstrap.defaults.ppfd,
      photoperiod_hours: parseFloat(document.getElementById("photoperiod-input").value) || bootstrap.defaults.photoperiod_hours,
      alpha: parseFloat(document.getElementById("alpha-input").value) || bootstrap.defaults.alpha,
      plant_name: document.getElementById("plant-name-input").value || "Plant",
    };

    if (targetCurve === "custom") {
      const file = document.getElementById("custom-curve-file").files[0];
      if (!file) {
        showError(analyzeErrorEl, "Upload a custom sensitivity curve file, or choose a built-in curve.");
        calculateBtn.disabled = false;
        calculateBtn.textContent = "Calculate";
        return;
      }
      formData.append("custom_file", file);
    }

    formData.append("payload", JSON.stringify(payload));
    let result;
    try {
      result = await postForm(`${BASE}/api/analyze`, formData);
    } catch (err) {
      showError(analyzeErrorEl, err.message);
      calculateBtn.disabled = false;
      calculateBtn.textContent = "Calculate";
      return;
    }
    calculateBtn.disabled = false;
    calculateBtn.textContent = "Calculate";

    // Analysis succeeded - always show the numeric metrics and reveal the
    // results card, even if chart rendering (a separate, non-essential step)
    // runs into a problem.
    lastAnalysis = { payload, result };
    renderMetrics(result.metrics);
    resultsCard.hidden = false;
    resultsCard.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      renderResultsChart(result);
    } catch (err) {
      console.error("Failed to render the results chart:", err);
      showError(analyzeErrorEl, "Calculated successfully, but the chart failed to render (see console). Metrics and report download still work.");
    }
  });

  function renderResultsChart(result) {
    const ctx = document.getElementById("results-chart");
    if (resultsChart) resultsChart.destroy();
    resultsChart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: lastAnalysis.payload.emission_label,
            data: toPoints(result.wavelength, result.pl),
            borderColor: "#c0392b",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
          },
          {
            label: result.curve_label,
            data: toPoints(result.wavelength, result.x),
            borderColor: "#2c5aa0",
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
          },
        ],
      },
      options: chartOptions("Wavelength (nm)", "Normalized scale / sensitivity"),
      plugins: [regionBandsPlugin],
    });
  }

  // Chart.js only exposes a true numeric axis (so regionBandsPlugin's
  // getPixelForValue(400) etc. lands at the right spot) when points are
  // {x, y} pairs on a 'linear' scale - a plain `labels` array defaults to a
  // 'category' scale, where getPixelForValue treats 400/500/600/700 as
  // category indices instead of wavelengths and draws the bands in the
  // wrong place (this was broken before - see git history).
  function toPoints(xs, ys) {
    return xs.map((x, i) => ({ x, y: ys[i] }));
  }

  function renderMetrics(m) {
    document.getElementById("metric-overlap").textContent = `${m.normalized_overlap_score.toFixed(2)} %`;
    document.getElementById("metric-efficiency").textContent = `${m.net_growth_efficiency.toFixed(2)} %`;
    document.getElementById("metric-dli").textContent = `${m.dli.toFixed(2)} mol/m²/day`;
    document.getElementById("metric-yield").textContent = `${m.daily_biomass_yield.toFixed(2)} g/m²/day`;
  }

  function chartOptions(xLabel, yLabel) {
    return {
      responsive: true,
      animation: false,
      interaction: { mode: "nearest", intersect: false },
      scales: {
        x: { type: "linear", title: { display: true, text: xLabel }, ticks: { maxTicksLimit: 12 } },
        y: { title: { display: true, text: yLabel }, min: 0 },
      },
      plugins: { legend: { position: "top" } },
    };
  }

  // ---------- Report download ----------

  async function downloadReport(format) {
    if (!lastAnalysis) return;
    showError(analyzeErrorEl, null);
    const formData = new FormData();
    const payload = { ...lastAnalysis.payload, plant_name: document.getElementById("plant-name-input").value || "Plant" };
    formData.append("payload", JSON.stringify(payload));
    if (payload.target_curve === "custom") {
      const file = document.getElementById("custom-curve-file").files[0];
      if (file) formData.append("custom_file", file);
    }
    try {
      const response = await fetch(`${BASE}/api/report?format=${format}`, { method: "POST", body: formData });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Report request failed (${response.status})`);
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^";]+)"?/);
      const filename = match ? match[1] : `Analysis_Report.${format}`;
      const url = URL.createObjectURL(blob);
      const link = el("a", { href: url, download: filename });
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showError(analyzeErrorEl, err.message);
    }
  }

  document.getElementById("download-pdf-btn").addEventListener("click", () => downloadReport("pdf"));
  document.getElementById("download-png-btn").addEventListener("click", () => downloadReport("png"));
})();
