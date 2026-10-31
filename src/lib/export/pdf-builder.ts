import puppeteer, { Browser } from "puppeteer-core";
import fs from "fs";

let cachedBrowser: Browser | null = null;

export function findBrowserExecutable(): string {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidatePaths = [
    // Windows Chrome
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    // Windows Edge
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];

  for (const path of candidatePaths) {
    if (fs.existsSync(/* turbopackIgnore: true */ path)) {
      return path;
    }
  }

  throw new Error(
    "Tidak dapat menemukan executable browser (Chrome / Edge) di sistem untuk mengonversi dokumen ke PDF."
  );
}

export async function getOrLaunchBrowser(): Promise<Browser> {
  if (cachedBrowser && cachedBrowser.connected) {
    return cachedBrowser;
  }

  const executablePath = findBrowserExecutable();
  cachedBrowser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-zygote",
    ],
  });

  return cachedBrowser;
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
    const width = isF4 ? "215mm" : "210mm";
    const height = isF4 ? "330mm" : "297mm";

    const defaultMargins = {
      top: "15mm",
      bottom: "15mm",
      left: "15mm",
      right: "15mm",
    };

    const pdfUint8 = await page.pdf({
      width: options.landscape ? height : width,
      height: options.landscape ? width : height,
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
