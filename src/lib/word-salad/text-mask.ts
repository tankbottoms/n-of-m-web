/**
 * Generate a boolean grid mask from two stacked text lines using OffscreenCanvas.
 * Used to reveal text at the end of the animation sequence.
 */
export function generateTextMask(
  lines: [string, string],
  gridCols: number,
  gridRows: number,
  cellWidth: number,
  cellHeight: number,
): boolean[][] {
  const canvasW = gridCols * cellWidth;
  const canvasH = gridRows * cellHeight;

  const offscreen = new OffscreenCanvas(canvasW, canvasH);
  const ctx = offscreen.getContext("2d")!;

  // Region: centered ~50% of the canvas area (same footprint as QR codes)
  const regionW = canvasW * 0.7;
  const regionH = canvasH * 0.4;
  const regionX = (canvasW - regionW) / 2;
  const regionY = (canvasH - regionH) / 2;

  // Auto-size font to fill ~80% of region width based on the wider line
  const wider = lines[0].length > lines[1].length ? lines[0] : lines[1];
  let fontSize = Math.floor(regionH / 2.5);

  ctx.font = `bold ${fontSize}px "SF Mono", "Fira Code", "Consolas", monospace`;
  let measured = ctx.measureText(wider).width;
  const targetW = regionW * 0.8;
  if (measured > 0) {
    fontSize = Math.floor(fontSize * (targetW / measured));
  }
  fontSize = Math.max(12, Math.min(fontSize, Math.floor(regionH / 2)));

  ctx.font = `bold ${fontSize}px "SF Mono", "Fira Code", "Consolas", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";

  // Draw two lines vertically centered in the region
  const lineGap = fontSize * 1.4;
  const centerX = regionX + regionW / 2;
  const centerY = regionY + regionH / 2;
  ctx.fillText(lines[0], centerX, centerY - lineGap / 2);
  ctx.fillText(lines[1], centerX, centerY + lineGap / 2);

  // Sample pixel alpha at each grid cell center -> boolean mask
  const mask: boolean[][] = [];
  for (let r = 0; r < gridRows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < gridCols; c++) {
      const cx = Math.floor(c * cellWidth + cellWidth / 2);
      const cy = Math.floor(r * cellHeight + cellHeight / 2);
      const pixel = ctx.getImageData(cx, cy, 1, 1).data;
      row.push(pixel[3]! > 128);
    }
    mask.push(row);
  }

  return mask;
}
