# Blank Axes Generator

A lightweight, modern web-based utility for generating clean, custom Cartesian and polar coordinate axes as SVGs. Perfect for creating worksheet illustrations, slide decks, assignments, or high-quality printouts.

## Features

- **Cartesian Axes**: Customizable $x$ and $y$ bounds, grid step size, and customizable axis labels.
- **Polar Axes**: Custom ring counts, angle step size (15°, 30°, 45°, 60°, 90°), and horizontal/vertical labels.
- **Grid Options**: Show/hide grids, tick marks, and axis numbering with custom step intervals (label frequency).
- **Responsive Layout Options**: Presets for Square, Landscape, and Portrait canvases.
- **SVG Export**: Download your custom configurations as clean, vector-based SVG files ready for embedding or printing.
- **Modern UI**: Dark/glassmorphic responsive layout with real-time SVG previews.

## Project Structure

```
Axes/
├── index.html     # Application structure and control panel
├── styles.css     # Premium styling, typography, and responsive layouts
├── script.js      # SVG generation logic and rendering controls
└── .gitignore     # Git ignore rules for clean repository sync
```

## How to Run Locally

Since this project uses vanilla HTML, CSS, and JavaScript, it has zero external dependencies and runs completely in the browser.

### Option 1: Double-click
Simply open [index.html](file:///c:/Users/MHR/Desktop/Python%20Directory/Axes/index.html) directly in any modern web browser.

### Option 2: Live Server
If you want to host it locally using a simple Python server, run the following in your terminal:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.
