import { getRandomWord } from "./words";

export interface Cell {
  x: number;
  y: number;
  word: string;
  cycleInterval: number;
  lastCycleTime: number;
  inSilhouette: boolean;
  colorProgress: number; // 0 = normal (light), 1 = silhouette (dark)
  fadeDelay: number; // per-cell stagger delay for fluid transitions
  col: number;
  row: number;
}

export interface Grid {
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  cells: Cell[][];
}

export function createGrid(
  viewWidth: number,
  viewHeight: number,
  cellWidth: number,
  cellHeight: number,
): Grid {
  const cols = Math.floor(viewWidth / cellWidth);
  const rows = Math.floor(viewHeight / cellHeight);
  const cells: Cell[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        x: c * cellWidth,
        y: r * cellHeight,
        word: getRandomWord(),
        cycleInterval: 80 + Math.floor(Math.random() * 220),
        lastCycleTime: Math.random() * 300,
        inSilhouette: false,
        colorProgress: 0,
        fadeDelay: 0,
        col: c,
        row: r,
      });
    }
    cells.push(row);
  }

  return { cols, rows, cellWidth, cellHeight, cells };
}
