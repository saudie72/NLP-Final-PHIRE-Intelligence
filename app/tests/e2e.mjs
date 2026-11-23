// End-to-end browser test (QA Tester): full flow with the synthetic demo export.
// Usage: node tests/e2e.mjs <baseUrl> <screenshotDir>
// Checks: demo loads, columns auto-map, analysis completes, every page renders, drawer opens, export downloads,
// no console errors, and no request leaves the site's own origin (data-handling rule).
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // pre-installed globally in CI images; or npm i -D playwright
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:4173";
const out = process.argv[3] || "test-results";
mkdirSync(out, { recursive: true });
const origin = new URL(base).origin;
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`); };

const browser = await chromium.launch();
async function run(viewport, scheme, tag, shots) {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme, deviceScaleFactor: 2, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [], foreign = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => { const u = new URL(r.url()); if (!["http:", "https:"].includes(u.protocol)) return; if (u.origin !== origin) foreign.push(r.url()); });

  await page.goto(base);
  await page.getByTestId("demo").waitFor();
  await page.waitForFunction(() => !document.querySelector('[data-testid="demo"]').disabled);
  if (shots) await page.screenshot({ path: `${out}/${tag}-1-start.png` });
  await page.getByTestId("demo").click();
  await page.getByTestId("analyze").waitFor();
  const mapped = await page.locator(".ok").count();
  check(`${tag}: demo file loads and columns auto-map`, mapped === 16, `${mapped}/16 fields mapped`);
  if (shots) await page.screenshot({ path: `${out}/${tag}-2-mapping.png` });
  await page.getByTestId("analyze").click();
  await page.waitForSelector(".kpis", { timeout: 30000 });
  const total = await page.locator(".kpi b").first().textContent();
  check(`${tag}: analysis completes and dashboard shows`, total === "250", `tickets tile = ${total}`);
  if (shots) await page.screenshot({ path: `${out}/${tag}-3-dashboard.png`, fullPage: true });

  await page.getByRole("button", { name: "Payroll · Time · Absence" }).click();
  const pf = await page.locator(".kpi b").first().textContent();
  check(`${tag}: portfolio filter PY + TL + AM narrows the view`, Number(pf) > 0 && Number(pf) < 250, `${pf} tickets`);
  if (shots) await page.screenshot({ path: `${out}/${tag}-4-portfolio.png`, fullPage: true });
  await page.getByRole("button", { name: "All modules" }).click();

  await page.locator(".nav button", { hasText: "Tickets" }).click();
  const rows = await page.locator("tbody tr").count();
  check(`${tag}: ticket table renders`, rows === 50, `${rows} rows on page 1`);
  await page.fill("#q", "queued");
  const qrows = await page.locator("tbody tr").count();
  check(`${tag}: search filters the table`, qrows > 0 && qrows < 50, `${qrows} rows for "queued"`);
  await page.fill("#q", "functional");
  const frows = Number((await page.locator("p[aria-live]").textContent()).split(" ")[0]);
  check(`${tag}: search matches issue-area labels`, frows > 50, `${frows} tickets for "functional"`);
  await page.fill("#q", "queued");
  await page.locator("tbody tr").first().click();
  await page.waitForSelector(".drawer");
  await page.waitForTimeout(400); // let the slide-in finish before the screenshot
  const sims = await page.locator(".drawer .sim").count();
  check(`${tag}: ticket drawer shows classification and 5 similar tickets`, sims === 5, `${sims} similar`);
  if (shots) await page.screenshot({ path: `${out}/${tag}-5-ticket.png` });
  await page.getByTestId("chat-tab").click();
  await page.waitForSelector('[data-testid="chat-off"], #chat-expert');
  const chatOn = (await page.locator("#chat-expert").count()) > 0;
  check(`${tag}: expert chat tab renders (${chatOn ? "switched on, consent required, no message sent" : "not switched on"})`,
    chatOn ? (await page.locator("#chat-consent").count()) === 1 : true);
  if (shots) await page.screenshot({ path: `${out}/${tag}-5b-chat-off.png` });
  await page.keyboard.press("Escape");
  check(`${tag}: Escape closes the drawer`, (await page.locator(".drawer").count()) === 0);

  await page.locator(".nav button", { hasText: "Recurring" }).click();
  const groups = await page.locator("section.panel").count();
  check(`${tag}: recurring issues listed`, groups > 0, `${groups} clusters`);
  if (shots) await page.screenshot({ path: `${out}/${tag}-6-recurring.png`, fullPage: true });

  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export").click()]);
  check(`${tag}: Excel report downloads`, dl.suggestedFilename().endsWith("-analyzed.xlsx"), dl.suggestedFilename());
  if (tag === "desktop-light") await dl.saveAs(`${out}/report.xlsx`);

  await page.locator(".nav button", { hasText: "Resources" }).click();
  await page.waitForSelector(".team");
  check(`${tag}: Resources page shows team and metrics`, (await page.locator(".agent").count()) === 16);
  const links = await page.locator('[data-testid="links"] a').count();
  const guide = await page.locator('[data-testid="links"] a[href*="NTCut33EUofio3qY7ZNCXQ"]').count();
  check(`${tag}: Resources lists every link the project relies on, including the guide`, links >= 30 && guide === 1, `${links} links`);
  check(`${tag}: footer links to Resources`, (await page.locator(".footer a", { hasText: "Resources" }).count()) === 1);
  if (shots) await page.screenshot({ path: `${out}/${tag}-7-resources.png`, fullPage: true });

  const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(`${tag}: no horizontal page scroll`, !hScroll);
  check(`${tag}: no console errors`, errors.length === 0, errors.slice(0, 3).map((e) => e.slice(0, 160)).join(" | "));
  check(`${tag}: no requests leave the site's origin`, foreign.length === 0, foreign.slice(0, 3).join(" | "));
  await ctx.close();
}
await run({ width: 1440, height: 900 }, "light", "desktop-light", true);
await run({ width: 1440, height: 900 }, "dark", "desktop-dark", true);
await run({ width: 390, height: 844 }, "light", "phone", true);
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
