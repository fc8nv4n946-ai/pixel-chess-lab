import { useEffect, useRef, useState } from "react";
import { type Color, type Square, type PieceSymbol } from "chess.js";
import { levels } from "./ai/engine";
import { type Level } from "./game/rules";
import { useGame } from "./game/useGame";
import { pieceNames } from "./art/pieces";
const art = Object.fromEntries(
  (["w", "b"] as const).flatMap((c) =>
    (["p", "n", "b", "r", "q", "k"] as const).map((p) => [
      c + p,
      `${import.meta.env.BASE_URL}pieces/${c}${p}.svg`,
    ]),
  ),
);
function Piece({
  color,
  type,
  small = false,
}: {
  color: Color;
  type: PieceSymbol;
  small?: boolean;
}) {
  return (
    <img
      className={small ? "piece small" : "piece"}
      src={art[color + type]}
      alt={`${color === "w" ? "Белые" : "Чёрные"}: ${pieceNames[type]}`}
      draggable={false}
    />
  );
}
export default function App() {
  const controller = useGame();
  const {
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
    move,
    click,
    undo,
    exportPgn,
    resign,
    retry,
  } = controller;
  const [setup, setSetup] = useState(false);
  const [confirm, setConfirm] = useState<"restart" | "resign" | null>(null);
  const historyEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    historyEnd.current?.scrollIntoView({ block: "nearest" });
  }, [version]);
  function newGame(c = color, l = level) {
    controller.newGame(c, l);
    setSetup(false);
    setConfirm(null);
  }
  const files = color === "w" ? "abcdefgh" : "hgfedcba";
  const ranks =
    color === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  function captured(by: Color) {
    return history
      .filter((m) => m.color === by && m.captured)
      .map((m, i) => (
        <Piece
          key={i}
          color={by === "w" ? "b" : "w"}
          type={m.captured!}
          small
        />
      ));
  }
  return (
    <div className="app">
      <header>
        <a
          className="brand"
          href={import.meta.env.BASE_URL}
          onClick={(e) => {
            e.preventDefault();
            setSetup(true);
          }}
        >
          <span className="brand-mark">
            P<span>×</span>C
          </span>
          <span>
            PIXEL CHESS <b>LAB</b>
            <small>МАЛЕНЬКАЯ ДОСКА. БОЛЬШАЯ ИГРА.</small>
          </span>
        </a>
        <div className="header-right">
          <span className="local-badge">
            <i /> ЛОКАЛЬНЫЙ ДВИЖОК
          </span>
          <button
            className="sound"
            onClick={toggleSound}
            aria-label={sound ? "Выключить звук" : "Включить звук"}
          >
            {sound ? "ЗВУК ВКЛ" : "ЗВУК ВЫКЛ"}
          </button>
        </div>
      </header>
      {!active ? (
        <main className="landing">
          <div className="intro">
            <span className="eyebrow">ШАХМАТЫ В НОВОМ ПИКСЕЛЕ</span>
            <h1>
              Ваш следующий
              <br />
              блестящий <em>ход.</em>
            </h1>
            <p>
              Классическая игра. Пиксельный характер.
              <br />
              Только вы, доска и достойный соперник.
            </p>
            <div className="intro-pieces">
              <Piece color="w" type="k" />
              <Piece color="b" type="n" />
              <Piece color="w" type="q" />
            </div>
            <div className="feature-tags">
              <span>5 УРОВНЕЙ</span>
              <span>БЕЗ РЕГИСТРАЦИИ</span>
              <span>STOCKFISH 19</span>
            </div>
          </div>
          <Setup color={color} level={level} onStart={newGame} />
        </main>
      ) : (
        <main className="game-layout">
          <section className="board-column">
            <div className="player-bar">
              <div className="avatar">
                <Piece color={color === "w" ? "b" : "w"} type="n" small />
              </div>
              <div>
                <strong>
                  Stockfish 19 <span className="tag">CPU</span>
                </strong>
                <small>
                  {levels[level].name} · уровень {level}/5
                </small>
              </div>
              <span className={"player-state " + (busy ? "thinking" : "")}>
                {busy ? "РАЗМЫШЛЯЕТ…" : "ГОТОВ К ИГРЕ"}
              </span>
            </div>
            <div className="board-frame">
              <div className="board" role="group" aria-label="Шахматная доска">
                {ranks.flatMap((rank, ri) =>
                  [...files].map((file, fi) => {
                    const sq = (file + rank) as Square,
                      p = chess.get(sq),
                      isLegal = legal.some((m) => m.to === sq),
                      isLast = last?.from === sq || last?.to === sq,
                      isCheck =
                        p?.type === "k" &&
                        p.color === chess.turn() &&
                        chess.isCheck();
                    return (
                      <button
                        key={sq}
                        aria-label={`${sq}${p ? " " + (p.color === "w" ? "белые" : "чёрные") + " " + pieceNames[p.type] : ""}${isLegal ? " доступный ход" : ""}`}
                        aria-pressed={selected === sq}
                        data-square={sq}
                        onClick={() => click(sq)}
                        className={`square ${(file.charCodeAt(0) - 97 + rank) % 2 === 0 ? "light" : "dark"} ${isLast ? "last" : ""} ${selected === sq ? "selected" : ""} ${isCheck ? "check" : ""}`}
                      >
                        <span className="coordinates">
                          {fi === 0 && <span className="rank">{rank}</span>}
                          {ri === 7 && <span className="file">{file}</span>}
                        </span>
                        {p && <Piece color={p.color} type={p.type} />}{" "}
                        {isLegal && (
                          <span className={p ? "legal capture" : "legal"} />
                        )}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>
            <div className="player-bar human">
              <div className="avatar gold">
                <Piece color={color} type="k" small />
              </div>
              <div>
                <strong>
                  Вы{" "}
                  <span className="tag">
                    {color === "w" ? "БЕЛЫЕ" : "ЧЁРНЫЕ"}
                  </span>
                </strong>
                <small>
                  {result
                    ? "Партия завершена"
                    : chess.turn() === color
                      ? "Ваша очередь творить"
                      : "Следующий ход за вами"}
                </small>
              </div>
              <span className="turn-light" />
            </div>
            <div className="board-note">
              <span>Кликните на фигуру, затем на клетку</span>
              <span>СТАНДАРТНЫЕ ШАХМАТЫ</span>
            </div>
          </section>
          <aside className="sidebar">
            <section className="status-card">
              <span className="eyebrow">
                {result ? "ФИНАЛ ПАРТИИ" : "ПАРТИЯ В ПРОЦЕССЕ"}
              </span>
              <h2 aria-live="polite">
                {result ??
                  (busy
                    ? "Ход компьютера"
                    : chess.isCheck()
                      ? "Ваш король под шахом"
                      : chess.turn() === color
                        ? "Ваш ход"
                        : "Ход компьютера")}
              </h2>
              <p>
                {result
                  ? "Каждая партия — новое открытие."
                  : busy
                    ? "Соперник изучает позицию."
                    : chess.isCheck()
                      ? "Защитите короля легальным ходом."
                      : "Найдите свой лучший ход."}
              </p>
              <div className="captured-row">
                <span>ВЫ ВЗЯЛИ</span>
                <div>
                  {captured(color).length ? captured(color) : <small>—</small>}
                </div>
              </div>
              <div className="captured-row">
                <span>CPU ВЗЯЛ</span>
                <div>
                  {captured(color === "w" ? "b" : "w").length ? (
                    captured(color === "w" ? "b" : "w")
                  ) : (
                    <small>—</small>
                  )}
                </div>
              </div>
            </section>
            <section className="history-card">
              <div className="section-title">
                <h3>История ходов</h3>
                <span>{history.length} ПОЛУХОДОВ</span>
              </div>
              <div className="history-scroll">
                <div className="history-head">
                  <span>№</span>
                  <span>БЕЛЫЕ</span>
                  <span>ЧЁРНЫЕ</span>
                </div>
                {history.length === 0 ? (
                  <div className="empty-history">
                    <span className="pixel-cross">+</span>
                    <p>
                      История начинается
                      <br />с первого хода
                    </p>
                  </div>
                ) : (
                  Array.from(
                    { length: Math.ceil(history.length / 2) },
                    (_, i) => (
                      <div className="move-row" key={i}>
                        <span>{i + 1}.</span>
                        <span>{history[i * 2]?.san}</span>
                        <span
                          className={
                            i * 2 + 1 === history.length - 1 ? "latest" : ""
                          }
                        >
                          {history[i * 2 + 1]?.san ?? "…"}
                        </span>
                      </div>
                    ),
                  )
                )}
                <div ref={historyEnd} />
              </div>
            </section>
            <section className="controls">
              <button className="primary" onClick={() => setSetup(true)}>
                + Новая партия
              </button>
              <div className="control-grid">
                <button
                  disabled={!history.length || !!promotion}
                  onClick={undo}
                >
                  ↶ Отменить ход
                </button>
                <button onClick={() => setConfirm("restart")}>
                  Перезапуск
                </button>
                <button
                  disabled={!!result}
                  onClick={() => setConfirm("resign")}
                >
                  Сдаться
                </button>
                <button onClick={exportPgn}>Экспорт PGN</button>
              </div>
            </section>
            <p className="save-status">
              {saveWarning || "● Партия сохраняется автоматически"}
            </p>
            {error && (
              <div role="alert" className="error">
                {error}
                <button onClick={retry}>Повторить расчёт</button>
              </div>
            )}
            <span role="status" className="notice">
              {notice}
            </span>
          </aside>
        </main>
      )}
      <footer>
        <span>СДЕЛАНО ИЗ ПИКСЕЛЕЙ И ХОРОШИХ ХОДОВ</span>
        <span>
          PIXEL CHESS LAB ·{" "}
          <a
            href={`${import.meta.env.BASE_URL}licenses/index.html`}
            target="_blank"
            rel="noreferrer"
          >
            GPL-3.0 / Stockfish
          </a>{" "}
          ·{" "}
          <a href="https://github.com/fc8nv4n946-ai/pixel-chess-lab">
            Исходники
          </a>
        </span>
      </footer>
      {setup && (
        <div className="overlay">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Новая партия"
          >
            <button
              className="close"
              aria-label="Закрыть"
              onClick={() => setSetup(false)}
            >
              ×
            </button>
            <Setup color={color} level={level} onStart={newGame} />
            <p className="modal-note">
              Новая партия заменит текущее сохранение.
            </p>
          </div>
        </div>
      )}
      {promotion && (
        <div className="overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Превращение пешки"
          >
            <span className="eyebrow">НОВАЯ ВОЗМОЖНОСТЬ</span>
            <h2>Выберите фигуру</h2>
            <div className="promotion">
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  aria-label={pieceNames[p]}
                  onClick={() => move(promotion.from, promotion.to, p)}
                >
                  <Piece color={color} type={p} />
                  <small>{pieceNames[p]}</small>
                </button>
              ))}
            </div>
            <button onClick={() => setPromotion(null)}>Назад</button>
          </section>
        </div>
      )}
      {confirm && (
        <div className="overlay">
          <section className="modal confirm" role="dialog" aria-modal="true">
            <h2>{confirm === "resign" ? "Сдать партию?" : "Начать заново?"}</h2>
            <p>
              {confirm === "resign"
                ? "Победа будет присуждена компьютеру."
                : "Текущая позиция будет потеряна."}
            </p>
            <button
              className="primary"
              onClick={() => {
                if (confirm === "restart") newGame();
                else {
                  resign();
                  setConfirm(null);
                }
              }}
            >
              Да, {confirm === "resign" ? "сдаться" : "перезапустить"}
            </button>
            <button onClick={() => setConfirm(null)}>Продолжить игру</button>
          </section>
        </div>
      )}
    </div>
  );
}
function Setup({
  color,
  level,
  onStart,
}: {
  color: Color;
  level: Level;
  onStart: (c: Color, l: Level) => void;
}) {
  const [c, setC] = useState(color),
    [l, setL] = useState(level);
  return (
    <section className="setup-card">
      <span className="eyebrow">ВАША ПАРТИЯ</span>
      <h2>Расставим акценты</h2>
      <p>Выберите сторону и силу соперника</p>
      <label>
        01 <span>ВАШ ЦВЕТ</span>
      </label>
      <div className="color-options">
        {(["w", "b"] as const).map((v) => (
          <button
            key={v}
            className={c === v ? "chosen" : ""}
            onClick={() => setC(v)}
            aria-pressed={c === v}
          >
            <Piece color={v} type="k" />
            <span>{v === "w" ? "Белые" : "Чёрные"}</span>
            <small>
              {v === "w" ? "Первый ход за вами" : "Первый ход за CPU"}
            </small>
          </button>
        ))}
      </div>
      <label>
        02 <span>СИЛА СОПЕРНИКА</span>
      </label>
      <div className="levels">
        {([1, 2, 3, 4, 5] as Level[]).map((v) => (
          <button
            key={v}
            aria-label={`Уровень ${v}: ${levels[v].name}`}
            aria-pressed={l === v}
            className={l === v ? "chosen" : ""}
            onClick={() => setL(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="level-caption">
        <b>{levels[l].name}</b>
        <span>
          {
            [
              "Первые шаги без спешки",
              "Простор для экспериментов",
              "Время продумать план",
              "Серьёзный вызов",
              "Каждый ход имеет значение",
            ][l - 1]
          }
        </span>
      </div>
      <button className="primary start" onClick={() => onStart(c, l)}>
        Начать партию <span>→</span>
      </button>
      <small className="private-note">
        Всё работает в вашем браузере. Без аккаунта.
      </small>
    </section>
  );
}
