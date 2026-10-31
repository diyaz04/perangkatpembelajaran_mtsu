import puppeteer, { Browser } from "puppeteer-core";
import fs from "fs";

let cachedBrowser: Browser | null = null;

export function findLocalBrowserExecutable(): string | null {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const localAppData = process.env.LOCALAPPDATA || "";
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

  const candidatePaths = [
    // Windows Chrome (Standard & User Local)
    `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
    localAppData ? `${localAppData}\\Google\\Chrome\\Application\\chrome.exe` : "",
    // Windows Edge (Standard & User Local)
    `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    localAppData ? `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe` : "",
    // Windows Brave
    `${programFiles}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    `${programFilesX86}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ].filter(Boolean);

  for (const path of candidatePaths) {
    if (fs.existsSync(/* turbopackIgnore: true */ path)) {
      return path;
    }
  }

  return null;
}

export async function getOrLaunchBrowser(): Promise<Browser> {
  if (cachedBrowser && cachedBrowser.connected) {
    try {
      await cachedBrowser.version();
      return cachedBrowser;
    } catch {
      cachedBrowser = null;
    }
  }

  const localPath = findLocalBrowserExecutable();

  if (localPath) {
    // 1. Jika ada browser lokal (misal saat running di Windows / Mac / Linux ber-GUI)
    cachedBrowser = await puppeteer.launch({
      executablePath: localPath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--no-zygote",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-sync",
        "--mute-audio",
        "--hide-scrollbars",
      ],
    });
    return cachedBrowser;
  }

  // 2. Jika di cloud serverless (Vercel / AWS Lambda / Docker) gunakan @sparticuz/chromium
  try {
    const chromium = (await import("@sparticuz/chromium")).default;
    chromium.setGraphicsMode = false;

    cachedBrowser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    return cachedBrowser;
  } catch (err) {
    console.error("Gagal menjalankan @sparticuz/chromium:", err);
    throw new Error(
      "Tidak dapat menjalankan Chromium untuk membuat PDF di server cloud: " +
        (err instanceof Error ? err.message : String(err))
    );
  }
}

export interface PdfOptions {
  landscape?: boolean;
  paperSize?: "A4" | "F4";
  margins?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

export async function generatePdfBufferFromHtml(
  html: string,
  options: PdfOptions = {}
): Promise<Buffer> {
  const browser = await getOrLaunchBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    // F4 / Folio: 215mm x 330mm, A4: 210mm x 297mm
    const isF4 = options.paperSize === "F4";
    const defaultMargins = {
      top: "12mm",
      bottom: "12mm",
      left: "12mm",
      right: "12mm",
    };

    const pdfUint8 = await page.pdf({
      format: isF4 ? undefined : "A4",
      width: isF4 ? (options.landscape ? "330mm" : "215mm") : undefined,
      height: isF4 ? (options.landscape ? "215mm" : "330mm") : undefined,
      landscape: options.landscape || false,
      printBackground: true,
      margin: options.margins || defaultMargins,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfUint8);
  } finally {
    await page.close().catch(() => {});
  }
}
