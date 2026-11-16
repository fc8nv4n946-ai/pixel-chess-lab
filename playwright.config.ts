import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:4173/pixel-chess-lab/",
    headless: true,
    launchOptions: { executablePath: process.env.CHROMIUM_PATH },
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173/pixel-chess-lab/",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
