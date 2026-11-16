import type { Color, PieceSymbol } from "chess.js";
// Hand-drawn 16 × 20 pixel silhouettes; palette layers keep every sprite crisp.
const shapes: Record<PieceSymbol, string[]> = {
  p: [
    "......XXXX......",
    ".....XXXXXX.....",
    ".....XXXXXX.....",
    "......XXXX......",
    ".......XX.......",
    "......XXXX......",
    "......XXXX......",
    ".....XXXXXX.....",
    "....XXXXXXXX....",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
  ],
  r: [
    "...XX..XX..XX...",
    "...XXXXXXXXXX...",
    "...XXXXXXXXXX...",
    "....XXXXXXXX....",
    ".....XXXXXX.....",
    ".....XXXXXX.....",
    ".....XXXXXX.....",
    ".....XXXXXX.....",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
    "...XXXXXXXXXX...",
  ],
  n: [
    ".......XXXX.....",
    "......XXXXXX....",
    ".....XXXXXXX....",
    "....XXXXXXXXX...",
    "...XXXX.XXXXX...",
    "..XXXXXXXXXXX...",
    "..XXXXX.XXXXX...",
    ".......XXXXXX...",
    "......XXXXXXX...",
    ".....XXXXXXXX...",
    "....XXXXXXXXXX..",
  ],
  b: [
    ".......XX.......",
    "......XXXX......",
    ".....XXXXXX.....",
    "....XXXX.XXX....",
    "....XXX.XXXX....",
    ".....XXXXXX.....",
    "......XXXX......",
    "......XXXX......",
    ".....XXXXXX.....",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
  ],
  q: [
    "..XX...XX...XX..",
    "..XXX.XXXX.XXX..",
    "...XXXXXXXXXX...",
    "...XXXXXXXXXX...",
    "....XXXXXXXX....",
    ".....XXXXXX.....",
    ".....XXXXXX.....",
    ".....XXXXXX.....",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
    "...XXXXXXXXXX...",
  ],
  k: [
    ".......XX.......",
    ".....XXXXXX.....",
    ".......XX.......",
    "....XXXXXXXX....",
    "....XXXXXXXX....",
    ".....XXXXXX.....",
    "......XXXX......",
    ".....XXXXXX.....",
    ".....XXXXXX.....",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
  ],
};
export const pieceNames: Record<PieceSymbol, string> = {
  p: "пешка",
  n: "конь",
  b: "слон",
  r: "ладья",
  q: "ферзь",
  k: "король",
};
export function sprite(color: Color, type: PieceSymbol) {
  const rows = shapes[type];
  const outline = color === "w" ? "#594b3c" : "#080f1e";
  const fill = color === "w" ? "#f7e6b9" : "#526c89";
  const light = color === "w" ? "#fff8df" : "#8aa5bb";
  const shade = color === "w" ? "#c49b61" : "#2b405c";
  let pixels = "";
  rows.forEach((row, y) =>
    [...row].forEach((v, x) => {
      if (v !== "X") return;
      pixels += `<rect x="${x}" y="${y + 3}" width="1" height="1" fill="${x < 6 ? light : x > 9 ? shade : fill}"/>`;
    }),
  );
  const bases = `<path d="M4 15h8v1h1v2H3v-2h1z" fill="${fill}"/><path d="M3 17h10v1H3z" fill="${shade}"/>`;
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="80" viewBox="0 0 16 20" shape-rendering="crispEdges"><defs><filter id="o" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="0.6"/><feFlood flood-color="${outline}"/><feComposite in2="morphology" operator="in"/></filter></defs><ellipse cx="8" cy="18.5" rx="6" ry="1" fill="#090d16" opacity=".25"/><g stroke="${outline}" stroke-width="1.2" stroke-linejoin="miter">${rows.map((r, y) => [...r].map((v, x) => (v === "X" ? `<rect x="${x}" y="${y + 3}" width="1" height="1"/>` : "")).join("")).join("")}${bases}</g>${pixels}${bases}<path d="M4 15h8v1H4z" fill="${light}"/></svg>`,
    )
  );
}
