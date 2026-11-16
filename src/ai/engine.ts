import type { Level } from "../game/rules";
export const levels = {
  1: { name: "Новичок", skill: 0, depth: 1, time: 80 },
  2: { name: "Лёгкий", skill: 3, depth: 4, time: 200 },
  3: { name: "Средний", skill: 8, depth: 8, time: 500 },
  4: { name: "Сложный", skill: 15, depth: 14, time: 1100 },
  5: { name: "Мастер", skill: 20, depth: 22, time: 2200 },
} as const;
export function searchCommands(fen: string, level: Level) {
  const l = levels[level];
  return [
    "setoption name Hash value 16",
    `setoption name Skill Level value ${l.skill}`,
    "ucinewgame",
    `position fen ${fen}`,
    `go depth ${l.depth} movetime ${l.time}`,
  ];
}
export class Engine {
  private worker: Worker | null = null;
  private reject: ((e: Error) => void) | null = null;
  cancel() {
    this.worker?.terminate();
    this.worker = null;
    this.reject?.(new Error("cancelled"));
    this.reject = null;
  }
  bestMove(fen: string, level: Level): Promise<string> {
    this.cancel();
    return new Promise((resolve, reject) => {
      this.reject = reject;
      const worker = new Worker(
        `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`,
      );
      this.worker = worker;
      const timer = setTimeout(
        () =>
          finish(undefined, new Error("Движок не ответил. Повторите расчёт.")),
        20000,
      );
      const finish = (move?: string, error?: Error) => {
        clearTimeout(timer);
        worker.terminate();
        if (this.worker === worker) {
          this.worker = null;
          this.reject = null;
        }
        error ? reject(error) : resolve(move!);
      };
      this.reject = (e) => {
        clearTimeout(timer);
        reject(e);
      };
      worker.onerror = () =>
        finish(
          undefined,
          new Error(
            "Не удалось загрузить Stockfish. Проверьте поддержку WebAssembly.",
          ),
        );
      let started = false;
      worker.onmessage = (e: MessageEvent<string>) => {
        const line = String(e.data);
        if (line === "uciok") worker.postMessage("isready");
        if (line === "readyok" && !started) {
          started = true;
          searchCommands(fen, level).forEach((c) => worker.postMessage(c));
        }
        if (line.startsWith("bestmove ")) finish(line.split(" ")[1]);
      };
      worker.postMessage("uci");
    });
  }
}
