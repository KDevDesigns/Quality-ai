// Prints the DAR's HTML (lib/dar/html.ts) to a landscape PDF with Playwright's Chromium, which is already installed on
// this machine for test runs. Loaded lazily so pages that never make a PDF don't pay for it.

import { PRINT_PAGE, PRINT_PAPER } from "./html";

export class DarPdfError extends Error {}

export async function htmlToPdf(html: string): Promise<Buffer> {
  let chromium: typeof import("playwright-core").chromium;
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    throw new DarPdfError("PDF isn't available on this server (Playwright is missing). Download the Excel file instead.");
  }

  let browser: Awaited<ReturnType<typeof chromium.launch>>;
  try {
    browser = await chromium.launch();
  } catch {
    throw new DarPdfError("PDF isn't available on this server: run `npx playwright install chromium` once. Download the Excel file meanwhile.");
  }
  try {
    // Lay it out on a landscape long bond page (13 × 8.5 in at 96 px/in; the HTML's own padding is the margin), then
    // shrink the sheet, not the margins, to fit one page like the paper form. Same as the Print button.
    const page = await browser.newPage({ viewport: PRINT_PAPER });
    await page.emulateMedia({ media: "print" });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate((h) => {
      const zoom = Math.min(1, (h - 4) / document.body.scrollHeight);
      if (zoom < 1) document.body.style.zoom = String(zoom);
    }, PRINT_PAGE.height);
    return await page.pdf({ width: "13in", height: "8.5in", printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
  } finally {
    await browser.close();
  }
}
