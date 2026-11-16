import { useEffect, useRef, useState } from "react";
import { Chess, type Color, type Square } from "chess.js";
import { Engine, levels } from "../ai/engine";
import { SAVE_KEY, restore, undoRound, outcome, type Level } from "./rules";
import { playSound } from "./sound";
function readSave() {
  try {
    return restore(localStorage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}
export function useGame() {
  const [initial] = useState(readSave);
  const game = useRef(initial?.chess ?? new Chess());
  const [color, setColor] = useState<Color>(initial?.data.color ?? "w");
  const [level, setLevel] = useState<Level>(initial?.data.level ?? 2);
  const [active, setActive] = useState(!!initial);
  const [resigned, setResigned] = useState(initial?.data.resigned ?? false);
  const [version, refresh] = useState(0);
  const [selected, select] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saveWarning, setSaveWarning] = useState("");
  const [sound, setSound] = useState(() => {
    try {
      return localStorage.getItem("pcl.sound") !== "off";
    } catch {
      return true;
    }
  });
  const soundEnabled = useRef(sound);
  soundEnabled.current = sound;
  const engine = useRef(new Engine());
  const chess = game.current,
    result = outcome(chess, color, resigned),
    history = chess.history({ verbose: true }),
    last = history.at(-1);
  const legal = selected
    ? chess.moves({ square: selected, verbose: true })
    : [];
  useEffect(() => {
    if (!active) return;
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          version: 1,
          pgn: game.current.pgn(),
          color,
          level,
          resigned,
        }),
      );
      setSaveWarning("");
    } catch {
      setSaveWarning(
        "Сохранение недоступно в этом браузере. Экспортируйте PGN.",
      );
    }
  }, [version, color, level, resigned, active]);
  useEffect(() => {
    if (!active || result || chess.turn() === color) return;
    let stale = false;
    setBusy(true);
    setError("");
    engine.current
      .bestMove(chess.fen(), level)
      .then((uci) => {
        if (stale) return;
        try {
          const move = chess.move({
            from: uci.slice(0, 2),
            to: uci.slice(2, 4),
            promotion: uci[4],
          });
          if (soundEnabled.current) playSound(!!move.captured);
          refresh((v) => v + 1);
        } catch {
          setError("Движок вернул некорректный ход. Повторите расчёт.");
        }
      })
      .catch((e) => {
        if (!stale) setError(e.message);
      })
      .finally(() => {
        if (!stale) setBusy(false);
      });
    return () => {
      stale = true;
      engine.current.cancel();
    };
    // A revision denotes an atomic chess.js state change.
  }, [version, active, color, level, result]);
  function newGame(c = color, l = level) {
    engine.current.cancel();
    game.current = new Chess();
    setColor(c);
    setLevel(l);
    setResigned(false);
    select(null);
    setPromotion(null);
    setBusy(false);
    setError("");
    setNotice("");
    setActive(true);
    refresh((v) => v + 1);
  }
  function move(from: Square, to: Square, promote?: string) {
    try {
      const m = chess.move({ from, to, promotion: promote });
      if (soundEnabled.current) playSound(!!m.captured);
      select(null);
      setPromotion(null);
      refresh((v) => v + 1);
    } catch {
      select(null);
    }
  }
  function click(square: Square) {
    if (busy || result || chess.turn() !== color || promotion) return;
    const target = legal.filter((m) => m.to === square);
    if (selected && target.length) {
      if (target.some((m) => m.promotion)) {
        setPromotion({ from: selected, to: square });
        return;
      }
      move(selected, square);
      return;
    }
    select(
      chess.get(square)?.color === color
        ? selected === square
          ? null
          : square
        : null,
    );
  }
  function undo() {
    engine.current.cancel();
    undoRound(chess, color);
    setBusy(false);
    setResigned(false);
    select(null);
    setPromotion(null);
    setError("");
    refresh((v) => v + 1);
  }
  function exportPgn() {
    const copy = new Chess();
    copy.loadPgn(chess.pgn());
    copy.header(
      "Event",
      "Pixel Chess Lab",
      "White",
      color === "w" ? "Player" : `Stockfish 19 • ${levels[level].name}`,
      "Black",
      color === "b" ? "Player" : `Stockfish 19 • ${levels[level].name}`,
    );
    copy.header(
      "Result",
      resigned
        ? color === "w"
          ? "0-1"
          : "1-0"
        : chess.isCheckmate()
          ? chess.turn() === "w"
            ? "0-1"
            : "1-0"
          : chess.isDraw()
            ? "1/2-1/2"
            : "*",
    );
    const a = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([copy.pgn()], { type: "application/x-chess-pgn" }),
    );
    a.href = url;
    a.download = "pixel-chess-lab.pgn";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("PGN экспортирован");
  }
  function resign() {
    engine.current.cancel();
    setBusy(false);
    setResigned(true);
  }
  function retry() {
    refresh((v) => v + 1);
  }
  function toggleSound() {
    setSound(!sound);
    try {
      localStorage.setItem("pcl.sound", sound ? "off" : "on");
    } catch {}
    if (!sound) playSound();
  }
  return {
    color,
    level,
    active,
    version,
    selected,
    promotion,
    setPromotion,
    busy,
    error,
    notice,
    saveWarning,
    sound,
    toggleSound,
    chess,
    result,
    history,
    last,
    legal,
    newGame,
    move,
    click,
    undo,
    exportPgn,
    resign,
    retry,
  };
}
