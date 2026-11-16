import { describe, it, expect } from "vitest";
import { Chess, type Square } from "chess.js";
import { outcome, restore, undoRound } from "../src/game/rules";
import { searchCommands, levels } from "../src/ai/engine";
import { sprite } from "../src/art/pieces";
describe("standard chess", () => {
  it.each(["O-O", "O-O-O"])("castles %s for both colors", (san) => {
    for (const turn of ["w", "b"]) {
      const c = new Chess(`r3k2r/8/8/8/8/8/8/R3K2R ${turn} KQkq - 0 1`);
      c.move(san);
      expect(
        c.get(
          ((san === "O-O" ? "g" : "c") + (turn === "w" ? "1" : "8")) as Square,
        )?.type,
      ).toBe("k");
      expect(
        c.get(
          ((san === "O-O" ? "f" : "d") + (turn === "w" ? "1" : "8")) as Square,
        )?.type,
      ).toBe("r");
    }
  });
  it("forbids castling through check", () => {
    const c = new Chess("k4r2/8/8/8/8/8/8/4K2R w K - 0 1");
    expect(c.moves()).not.toContain("O-O");
  });
  it("en passant removes passed pawn and undo restores it", () => {
    const c = new Chess();
    ["e4", "a6", "e5", "d5", "exd6"].forEach((m) => c.move(m));
    expect(c.get("d5")).toBeUndefined();
    expect(c.get("d6")?.color).toBe("w");
    c.undo();
    expect(c.get("d5")?.color).toBe("b");
  });
  it.each(["q", "r", "b", "n"])("promotes to %s", (p) => {
    const c = new Chess("7k/P7/8/8/8/8/8/7K w - - 0 1");
    c.move({ from: "a7", to: "a8", promotion: p });
    expect(c.get("a8")?.type).toBe(p);
  });
  it("check constrains legal moves", () => {
    const c = new Chess("4r2k/8/8/8/8/8/8/4K3 w - - 0 1");
    expect(c.isCheck()).toBe(true);
    expect(() => c.move("Ke2")).toThrow();
  });
  it("recognizes mate", () => {
    const c = new Chess();
    ["f3", "e5", "g4", "Qh4#"].forEach((m) => c.move(m));
    expect(c.isCheckmate()).toBe(true);
    expect(outcome(c, "w", false)).toContain("Мат");
  });
  it("recognizes stalemate and material draw", () => {
    expect(
      outcome(new Chess("7k/5K2/6Q1/8/8/8/8/8 b - - 0 1"), "w", false),
    ).toContain("пат");
    expect(
      new Chess("7k/8/8/8/8/8/8/K7 w - - 0 1").isInsufficientMaterial(),
    ).toBe(true);
  });
  it("recognizes repetition and fifty move draw", () => {
    const c = new Chess();
    for (let i = 0; i < 2; i++)
      ["Nf3", "Nf6", "Ng1", "Ng8"].forEach((m) => c.move(m));
    expect(c.isThreefoldRepetition()).toBe(true);
    expect(
      new Chess("7k/8/8/8/8/8/R7/K7 w - - 100 51").isDrawByFiftyMoves(),
    ).toBe(true);
  });
  it("undoes a completed pair and a pending human move", () => {
    const c = new Chess();
    c.move("e4");
    c.move("e5");
    undoRound(c, "w");
    expect(c.fen()).toBe(new Chess().fen());
    c.move("d4");
    undoRound(c, "w");
    expect(c.history()).toHaveLength(0);
  });
  it("undo as black preserves the initial computer move", () => {
    const c = new Chess();
    ["e4", "e5", "Nf3"].forEach((m) => c.move(m));
    undoRound(c, "b");
    expect(c.history()).toEqual(["e4"]);
  });
  it("restores full history and rejects corrupt saves", () => {
    const c = new Chess();
    c.move("e4");
    const raw = JSON.stringify({
      version: 1,
      pgn: c.pgn(),
      color: "w",
      level: 3,
      resigned: false,
    });
    expect(restore(raw)?.chess.fen()).toBe(c.fen());
    expect(restore("{")).toBeNull();
    expect(restore("{}")).toBeNull();
  });
  it("five distinct engine search profiles", () => {
    expect(
      new Set(
        ([1, 2, 3, 4, 5] as const).map((l) =>
          JSON.stringify(searchCommands(new Chess().fen(), l)),
        ),
      ).size,
    ).toBe(5);
    expect(levels[5].skill).toBe(20);
  });
  it("has twelve distinct original sprites", () => {
    expect(
      new Set(
        (["w", "b"] as const).flatMap((c) =>
          (["p", "n", "b", "r", "q", "k"] as const).map((p) => sprite(c, p)),
        ),
      ).size,
    ).toBe(12);
  });
});
