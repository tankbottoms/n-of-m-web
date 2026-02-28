import qrcode from "qrcode-generator";

export interface QRFrame {
  modules: boolean[][];
  size: number;
}

const QR_MESSAGES = [
  "https://n-of-m.atsignhandle.xyz",
  "https://n-of-m.atsignhandle.xyz",
  "THE SECRET IS IN THE SHARES",
  "https://n-of-m.atsignhandle.xyz",
  "https://n-of-m.atsignhandle.xyz",
];

export function getQRMessage(index: number): string {
  return QR_MESSAGES[index % QR_MESSAGES.length]!;
}

export function generateQR(data: string): QRFrame {
  const qr = qrcode(0, "M");
  qr.addData(data);
  qr.make();
  const size = qr.getModuleCount();
  const modules: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(qr.isDark(r, c));
    }
    modules.push(row);
  }
  return { modules, size };
}

/**
 * Map QR modules to a grid-sized boolean mask.
 * Centered, visually square (compensates for rectangular cells),
 * occupying ~50% of total page area.
 */
export function qrToGridMask(
  qr: QRFrame,
  gridCols: number,
  gridRows: number,
  cellWidth: number,
  cellHeight: number,
): boolean[][] {
  const pageW = gridCols * cellWidth;
  const pageH = gridRows * cellHeight;

  // Target a visually square region covering ~50% of page area
  const targetSidePx = Math.sqrt(0.5 * pageW * pageH);
  const sidePx = Math.min(targetSidePx, pageW * 0.9, pageH * 0.9);

  // Grid cell counts for a visually square region
  const qrCols = Math.floor(sidePx / cellWidth);
  const qrRows = Math.floor(sidePx / cellHeight);

  const startCol = Math.floor((gridCols - qrCols) / 2);
  const startRow = Math.floor((gridRows - qrRows) / 2);

  const scaleC = qrCols / qr.size;
  const scaleR = qrRows / qr.size;

  const mask: boolean[][] = [];
  for (let r = 0; r < gridRows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < gridCols; c++) {
      const relR = r - startRow;
      const relC = c - startCol;
      if (relR >= 0 && relR < qrRows && relC >= 0 && relC < qrCols) {
        const qrR = Math.floor(relR / scaleR);
        const qrC = Math.floor(relC / scaleC);
        if (qrR < qr.size && qrC < qr.size) {
          row.push(qr.modules[qrR]![qrC]!);
        } else {
          row.push(false);
        }
      } else {
        row.push(false);
      }
    }
    mask.push(row);
  }
  return mask;
}
