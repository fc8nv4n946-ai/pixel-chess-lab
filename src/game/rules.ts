import { Chess, type Color } from "chess.js";
export type Level = 1 | 2 | 3 | 4 | 5;
export interface SavedGame {
  version: 1;
  pgn: string;
  color: Color;
  level: Level;
  resigned: boolean;
}
export const SAVE_KEY = "pixel-chess-lab.v1";
export function restore(
  raw: string | null,
): { chess: Chess; data: SavedGame } | null {
  try {
    if (!raw) return null;
    const d = JSON.parse(raw) as SavedGame;
    if (
      d.version !== 1 ||
      !["w", "b"].includes(d.color) ||
      ![1, 2, 3, 4, 5].includes(d.level) ||
      typeof d.pgn !== "string" ||
      typeof d.resigned !== "boolean"
    )
      return null;
    const chess = new Chess();
    chess.loadPgn(d.pgn);
    return { chess, data: d };
  } catch {
    return null;
  }
}
export function undoRound(chess: Chess, human: Color) {
  if (!chess.history().length) return;
  chess.undo();
  if (chess.turn() !== human && chess.history().length) chess.undo();
}
export function outcome(
  chess: Chess,
  human: Color,
  resigned: boolean,
): string | null {
  if (resigned) return "Вы сдались. Победа компьютера";
  if (chess.isCheckmate())
    return chess.turn() === human
      ? "Мат. Победа компьютера"
      : "Мат. Вы победили!";
  if (chess.isStalemate()) return "Ничья — пат";
  if (chess.isThreefoldRepetition()) return "Ничья — троекратное повторение";
  if (chess.isInsufficientMaterial()) return "Ничья — недостаточно материала";
  if (chess.isDrawByFiftyMoves()) return "Ничья — правило 50 ходов";
  if (chess.isDraw()) return "Ничья";
  return null;
}
// Future abilities belong in a separate mode adapter. Standard mode always delegates to chess.js.
export const standardRules = { create: () => new Chess() };
