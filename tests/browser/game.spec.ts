import { test, expect } from "@playwright/test";
import { Chess } from "chess.js";
const save = (pgn = "", color = "w", level = 1) =>
  JSON.stringify({ version: 1, pgn, color, level, resigned: false });
test("full game flow, save, undo, export, restart and resignation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("");
  await page.getByRole("button", { name: "Уровень 1:", exact: false }).click();
  await page.getByRole("button", { name: "Начать партию" }).click();
  await page.locator("[data-square=e2]").click();
  await expect(page.locator("[data-square=e4]")).toHaveAccessibleName(
    /доступный ход/,
  );
  await page.locator("[data-square=e4]").click();
  await expect(page.locator(".move-row")).toContainText("e4");
  await expect
    .poll(() => page.locator(".move-row").innerText())
    .not.toContain("…");
  await page.reload();
  await expect(page.locator(".move-row")).toContainText("e4");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспорт PGN" }).click();
  expect((await download).suggestedFilename()).toContain(".pgn");
  await page.getByRole("button", { name: "Отменить ход" }).click();
  await expect(page.locator(".move-row")).toHaveCount(0);
  await page.getByRole("button", { name: "Сдаться", exact: true }).click();
  await page.getByRole("button", { name: "Да, сдаться" }).click();
  await expect(page.getByRole("heading", { name: /Вы сдались/ })).toBeVisible();
  await page.getByRole("button", { name: "Перезапуск", exact: true }).click();
  await page.getByRole("button", { name: "Да, перезапустить" }).click();
  await expect(page.getByRole("heading", { name: "Ваш ход" })).toBeVisible();
  expect(errors).toEqual([]);
});
for (const level of [1, 2, 3, 4, 5])
  test(`real local WASM returns legal move at level ${level}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(
      (s) => localStorage.setItem("pixel-chess-lab.v1", s),
      save("", "b", level),
    );
    await page.goto("");
    await expect(page.locator(".move-row")).toHaveCount(1, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Ваш ход" })).toBeVisible();
    const stored = await page.evaluate(() =>
      localStorage.getItem("pixel-chess-lab.v1"),
    );
    const c = new Chess();
    c.loadPgn(JSON.parse(stored!).pgn);
    expect(c.history()).toHaveLength(1);
    expect(c.turn()).toBe("b");
    expect(
      await page.locator(".square").first().getAttribute("data-square"),
    ).toBe("h1");
    expect(errors).toEqual([]);
  });
test("mobile layout, touch and cancellation during calculation", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/pixel-chess-lab/");
  await page.getByRole("button", { name: "Уровень 5:", exact: false }).tap();
  await page.getByRole("button", { name: "Начать партию" }).tap();
  await page.locator("[data-square=e2]").tap();
  await page.locator("[data-square=e4]").tap();
  await page.getByRole("button", { name: "Отменить ход" }).tap();
  await page.waitForTimeout(3000);
  await expect(page.locator(".move-row")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  await context.close();
});
test("promotion dialog", async ({ page }) => {
  const c = new Chess("7k/P7/8/8/8/8/8/7K w - - 0 1");
  await page.addInitScript(
    (s) => localStorage.setItem("pixel-chess-lab.v1", s),
    save(c.pgn()),
  );
  await page.goto("");
  await page.locator("[data-square=a7]").click();
  await page.locator("[data-square=a8]").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "ферзь", exact: true }).click();
  await expect(page.locator("[data-square=a8] img")).toHaveAttribute(
    "alt",
    /ферзь/,
  );
});
test("desktop screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("");
  await page.screenshot({ path: "test-results/landing.png", fullPage: true });
  await page.getByRole("button", { name: "Начать партию" }).click();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});
test("new game cancels previous worker and makes no external requests", async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4173") &&
      !r.url().startsWith("data:")
    )
      external.push(r.url());
  });
  await page.goto("");
  await page.getByRole("button", { name: "Уровень 5:", exact: false }).click();
  await page.getByRole("button", { name: "Начать партию" }).click();
  await page.locator("[data-square=d2]").click();
  await page.locator("[data-square=d4]").click();
  await page
    .getByRole("button", { name: "Новая партия", exact: false })
    .click();
  await page.getByRole("button", { name: "Начать партию" }).click();
  await page.waitForTimeout(2700);
  await expect(page.locator(".move-row")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ваш ход" })).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test("finished games restore their results", async ({ page }) => {
  const c = new Chess();
  ["f3", "e5", "g4", "Qh4#"].forEach((m) => c.move(m));
  await page.addInitScript(
    (s) => localStorage.setItem("pixel-chess-lab.v1", s),
    save(c.pgn()),
  );
  await page.goto("");
  await expect(
    page.getByRole("heading", { name: "Мат. Победа компьютера" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Сдаться", exact: true }),
  ).toBeDisabled();
});
