const form = document.getElementById("controls");
const preview = document.getElementById("preview");
const axisTypeField = document.getElementById("axisType");
const cartesianFields = document.querySelector(".cartesian-only");
const polarFields = document.querySelector(".polar-only");
const downloadButton = document.getElementById("downloadSvg");
const downloadPngButton = document.getElementById("downloadPng");

let currentSvg = "";

const sizeMap = {
  square: { width: 720, height: 720 },
  landscape: { width: 960, height: 640 },
  portrait: { width: 640, height: 960 },
};

axisTypeField.addEventListener("change", () => {
  const isCartesian = axisTypeField.value === "cartesian";
  cartesianFields.classList.toggle("hidden", !isCartesian);
  polarFields.classList.toggle("hidden", isCartesian);
  render();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  render();
});

downloadButton.addEventListener("click", () => {
  if (!currentSvg) {
    return;
  }

  const blob = new Blob([currentSvg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `blank-${axisTypeField.value}-axes.svg`;
  link.click();
  URL.revokeObjectURL(url);
});

downloadPngButton.addEventListener("click", () => {
  if (!currentSvg) {
    return;
  }

  const img = new Image();
  const blob = new Blob([currentSvg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    // 3x multiplier to ensure the rasterized PNG remains high-res/crisp
    const scale = 3;
    const config = readConfig();
    const canvas = document.createElement("canvas");
    canvas.width = config.width * scale;
    canvas.height = config.height * scale;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((pngBlob) => {
      if (pngBlob) {
        const pngUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `blank-${axisTypeField.value}-axes.png`;
        link.click();
        URL.revokeObjectURL(pngUrl);
      }
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  img.onerror = (err) => {
    console.error("Error generating PNG:", err);
    URL.revokeObjectURL(url);
  };

  img.src = url;
});

for (const element of form.elements) {
  element.addEventListener?.("input", () => {
    if (element.type !== "submit" && element.type !== "button") {
      render();
    }
  });
}

function render() {
  const config = readConfig();
  currentSvg = config.axisType === "cartesian"
    ? buildCartesianSvg(config)
    : buildPolarSvg(config);
  preview.innerHTML = currentSvg;
}

function readConfig() {
  const data = new FormData(form);
  const axisType = data.get("axisType");
  const size = sizeMap[data.get("canvasSize")] ?? sizeMap.square;

  return {
    axisType,
    width: size.width,
    height: size.height,
    xMin: Number(data.get("xMin")),
    xMax: Number(data.get("xMax")),
    yMin: Number(data.get("yMin")),
    yMax: Number(data.get("yMax")),
    gridStep: positiveStep(data.get("gridStep"), 1),
    cartesianXAxisLabel: String(data.get("cartesianXAxisLabel") || "x"),
    cartesianYAxisLabel: String(data.get("cartesianYAxisLabel") || "y"),
    ringCount: Math.max(1, Number(data.get("ringCount")) || 1),
    polarRadiusMax: Math.max(1, Number(data.get("polarRadiusMax")) || 1),
    angleStep: Math.max(1, Number(data.get("angleStep")) || 30),
    polarXAxisLabel: String(data.get("polarXAxisLabel") || "Re z"),
    polarYAxisLabel: String(data.get("polarYAxisLabel") || "Im z"),
    showGrid: data.get("showGrid") === "on",
    showTicks: data.get("showTicks") === "on",
    showNumbers: data.get("showNumbers") === "on",
    labelEvery: Math.max(1, Number(data.get("labelEvery")) || 1),
  };
}

function buildCartesianSvg(config) {
  const margin = 64;
  const innerWidth = config.width - margin * 2;
  const innerHeight = config.height - margin * 2;
  const xRange = normalizeRange(config.xMin, config.xMax);
  const yRange = normalizeRange(config.yMin, config.yMax);
  const xSpan = xRange.max - xRange.min;
  const ySpan = yRange.max - yRange.min;
  const unitScale = Math.min(innerWidth / xSpan, innerHeight / ySpan);
  const plotWidth = xSpan * unitScale;
  const plotHeight = ySpan * unitScale;
  const plotLeft = margin + (innerWidth - plotWidth) / 2;
  const plotTop = margin + (innerHeight - plotHeight) / 2;
  const plotRight = plotLeft + plotWidth;
  const plotBottom = plotTop + plotHeight;
  const axisY = plotTop + (yRange.max > 0 && yRange.min < 0 ? yRange.max * unitScale : yRange.max <= 0 ? 0 : plotHeight);
  const axisX = plotLeft + (xRange.min < 0 && xRange.max > 0 ? Math.abs(xRange.min) * unitScale : xRange.max <= 0 ? plotWidth : 0);
  const arrowReach = 14;
  const parts = [];

  parts.push(svgHeader(config.width, config.height));
  parts.push(`<rect width="${config.width}" height="${config.height}" fill="#fffdfa"/>`);
  parts.push("<defs>");
  parts.push(`<marker id="cart-arrow" markerWidth="10" markerHeight="10" refX="8.2" refY="5" orient="auto" markerUnits="userSpaceOnUse">`);
  parts.push(`<path d="M 0 0 L 8.2 5 L 0 10" fill="none" stroke="#25211d" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`);
  parts.push("</marker>");
  parts.push("</defs>");

  if (config.showGrid) {
    let xGridIndex = 0;
    for (const x of iterateRange(xRange.min, xRange.max, config.gridStep)) {
      const px = plotLeft + (x - xRange.min) * unitScale;
      parts.push(line(px, plotTop, px, plotBottom, "#cfc3b4", gridLineWidth(xGridIndex, config.labelEvery)));
      xGridIndex += 1;
    }
    let yGridIndex = 0;
    for (const y of iterateRange(yRange.min, yRange.max, config.gridStep)) {
      const py = plotTop + (yRange.max - y) * unitScale;
      parts.push(line(plotLeft, py, plotRight, py, "#cfc3b4", gridLineWidth(yGridIndex, config.labelEvery)));
      yGridIndex += 1;
    }
  }

  parts.push(`<line x1="${plotLeft}" y1="${axisY}" x2="${plotRight + arrowReach}" y2="${axisY}" stroke="#25211d" stroke-width="2.4" marker-end="url(#cart-arrow)" vector-effect="non-scaling-stroke"/>`);
  parts.push(`<line x1="${axisX}" y1="${plotBottom}" x2="${axisX}" y2="${plotTop - arrowReach}" stroke="#25211d" stroke-width="2.4" marker-end="url(#cart-arrow)" vector-effect="non-scaling-stroke"/>`);

  if (config.showTicks || config.showNumbers) {
    let xTickIndex = 0;
    for (const x of iterateRange(xRange.min, xRange.max, config.gridStep)) {
      const px = plotLeft + (x - xRange.min) * unitScale;
      if (config.showTicks) {
        parts.push(line(px, axisY - 8, px, axisY + 8, "#25211d", 1.6));
      }
      if (config.showNumbers && x !== 0 && shouldLabelTick(xTickIndex, config.labelEvery)) {
        parts.push(text(px, axisY + 24, x, "middle"));
      }
      xTickIndex += 1;
    }
    let yTickIndex = 0;
    for (const y of iterateRange(yRange.min, yRange.max, config.gridStep)) {
      const py = plotTop + (yRange.max - y) * unitScale;
      if (config.showTicks) {
        parts.push(line(axisX - 8, py, axisX + 8, py, "#25211d", 1.6));
      }
      if (config.showNumbers && y !== 0 && shouldLabelTick(yTickIndex, config.labelEvery)) {
        parts.push(text(axisX - 16, py + 4, y, "end"));
      }
      yTickIndex += 1;
    }
  }

  parts.push(
    cartesianAxisLabel(
      plotRight - 10,
      axisY - 14,
      config.cartesianXAxisLabel,
      "end"
    )
  );
  parts.push(
    cartesianAxisLabel(
      axisX + 12,
      plotTop + 28,
      config.cartesianYAxisLabel,
      "start"
    )
  );

  parts.push("</svg>");
  return parts.join("");
}

function buildPolarSvg(config) {
  const margin = 94;
  const radius = Math.min(config.width, config.height) / 2 - margin;
  const centerX = config.width / 2;
  const centerY = config.height / 2;
  const ringStep = radius / config.ringCount;
  const minorStroke = "#888888";
  const gridStroke = "#b8b8b8";
  const axisStroke = "#111111";
  const arrowSize = 14;
  const parts = [];

  parts.push(svgHeader(config.width, config.height));
  parts.push(`<rect width="${config.width}" height="${config.height}" fill="#fffdfa"/>`);
  parts.push("<defs>");
  parts.push(`<marker id="axis-arrow-end" markerWidth="10" markerHeight="10" refX="8.5" refY="5" orient="auto" markerUnits="userSpaceOnUse">`);
  parts.push(`<path d="M 0 0 L 8.5 5 L 0 10" fill="none" stroke="${axisStroke}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`);
  parts.push("</marker>");
  parts.push(`<marker id="axis-arrow-start" markerWidth="10" markerHeight="10" refX="1.5" refY="5" orient="auto" markerUnits="userSpaceOnUse">`);
  parts.push(`<path d="M 8.5 0 L 0 5 L 8.5 10" fill="none" stroke="${axisStroke}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`);
  parts.push("</marker>");
  parts.push("</defs>");

  if (config.showGrid) {
    for (let ring = 1; ring <= config.ringCount; ring += 1) {
      parts.push(
        `<circle cx="${centerX}" cy="${centerY}" r="${ringStep * ring}" fill="none" stroke="${gridStroke}" stroke-width="${gridLineWidth(ring, config.labelEvery)}"/>`
      );
    }
  }

  for (let angle = 0; angle < 360; angle += config.angleStep) {
    const radians = (angle - 90) * Math.PI / 180;
    const x = centerX + radius * Math.cos(radians);
    const y = centerY + radius * Math.sin(radians);
    const isMainAxis = angle % 90 === 0;
    if (!isMainAxis) {
      parts.push(line(centerX, centerY, x, y, minorStroke, 1.1));
    }
  }

  const axisLeft = centerX - radius - arrowSize;
  const axisRight = centerX + radius + arrowSize;
  const axisTop = centerY - radius - arrowSize;
  const axisBottom = centerY + radius + arrowSize;

  parts.push(`<line x1="${centerX}" y1="${axisBottom}" x2="${centerX}" y2="${axisTop}" stroke="${axisStroke}" stroke-width="1.5" marker-start="url(#axis-arrow-start)" marker-end="url(#axis-arrow-end)" vector-effect="non-scaling-stroke"/>`);
  parts.push(`<line x1="${axisLeft}" y1="${centerY}" x2="${axisRight}" y2="${centerY}" stroke="${axisStroke}" stroke-width="1.5" marker-start="url(#axis-arrow-start)" marker-end="url(#axis-arrow-end)" vector-effect="non-scaling-stroke"/>`);

  if (config.showTicks) {
    for (let ring = 1; ring <= config.ringCount; ring += 1) {
      const offset = ringStep * ring;
      parts.push(line(centerX - 6, centerY - offset, centerX + 6, centerY - offset, axisStroke, 1.2));
      parts.push(line(centerX - 6, centerY + offset, centerX + 6, centerY + offset, axisStroke, 1.2));
      parts.push(line(centerX - offset, centerY - 6, centerX - offset, centerY + 6, axisStroke, 1.2));
      parts.push(line(centerX + offset, centerY - 6, centerX + offset, centerY + 6, axisStroke, 1.2));
    }
  }

  parts.push(`<circle cx="${centerX}" cy="${centerY}" r="13" fill="none" stroke="${axisStroke}" stroke-width="1.6"/>`);
  parts.push(`<circle cx="${centerX}" cy="${centerY}" r="9" fill="none" stroke="${axisStroke}" stroke-width="1"/>`);

  if (config.showNumbers) {
    const radiusValueStep = config.polarRadiusMax / config.ringCount;
    for (let ring = config.labelEvery; ring <= config.ringCount; ring += config.labelEvery) {
      const labelValue = Math.round(radiusValueStep * ring);
      const labelOffset = ringStep * ring;
      parts.push(polarAxisNumber(centerX - 24, centerY - labelOffset + 8, labelValue));
      parts.push(polarAxisNumber(centerX + labelOffset, centerY + 20, labelValue));
      parts.push(polarAxisNumber(centerX - labelOffset, centerY + 20, -labelValue));
      parts.push(polarAxisNumber(centerX - 26, centerY + labelOffset + 8, -labelValue));
    }
  }

  parts.push(axisLabel(centerX + radius + 44, centerY + 10, config.polarXAxisLabel, "start"));
  parts.push(axisLabel(centerX, centerY - radius - 54, config.polarYAxisLabel, "middle"));

  if (config.showTicks && !config.showGrid) {
    for (let ring = 1; ring <= config.ringCount; ring += 1) {
      parts.push(
        `<circle cx="${centerX}" cy="${centerY}" r="${ringStep * ring}" fill="none" stroke="${minorStroke}" stroke-width="0.7" stroke-dasharray="3 6"/>`
      );
    }
  }

  parts.push("</svg>");
  return parts.join("");
}

function normalizeRange(a, b) {
  if (a === b) {
    return { min: a - 1, max: b + 1 };
  }
  return a < b ? { min: a, max: b } : { min: b, max: a };
}

function positiveStep(rawValue, fallback) {
  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function iterateRange(min, max, step) {
  const values = [];
  const epsilon = step / 1000000;
  const count = Math.floor((max - min) / step + epsilon);

  for (let index = 0; index <= count; index += 1) {
    values.push(roundToStep(min + index * step));
  }

  if (Math.abs(values[values.length - 1] - max) <= epsilon) {
    values[values.length - 1] = max;
  }

  return values;
}

function roundToStep(value) {
  return Math.round(value * 1000000) / 1000000;
}

function shouldLabelTick(index, interval) {
  return index % interval === 0;
}

function gridLineWidth(index, interval) {
  return interval > 1 && shouldLabelTick(index, interval) ? 1.6 : 1;
}

function svgHeader(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
}

function line(x1, y1, x2, y2, stroke, strokeWidth) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke"/>`;
}

function text(x, y, value, anchor) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Space Grotesk, sans-serif" font-size="16" fill="#51483f">${value}</text>`;
}

function cartesianAxisLabel(x, y, value, anchor) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Space Grotesk, sans-serif" font-size="18" font-weight="600" fill="#111111">${escapeXml(value)}</text>`;
}

function axisLabel(x, y, value, anchor) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Georgia, Times New Roman, serif" font-size="28" font-style="italic" fill="#111111">${escapeXml(value)}</text>`;
}

function polarAxisNumber(x, y, value) {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="28" font-style="italic" fill="#111111">${escapeXml(String(value))}</text>`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

render();
