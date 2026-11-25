import {
  launch,
  type Browser,
  type Page,
} from "puppeteer";

let browser: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;

const launchArgs = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-sync",
  "--no-first-run",
];

function resetBrowser(instance: Browser | null) {
  if (instance && browser === instance) {
    browser = null;
    launchPromise = null;
  }
}

async function launchBrowser(): Promise<Browser> {
  const instance = await launch({
    headless: true,
    args: launchArgs,
    protocolTimeout: 180000,
  });

  browser = instance;
  instance.on("disconnected", () => resetBrowser(instance));

  return instance;
}

export async function getBrowser() {
  if (browser?.connected) {
    return browser;
  }

  if (!launchPromise) {
    launchPromise = launchBrowser().catch((error) => {
      launchPromise = null;
      throw error;
    });
  }

  return launchPromise;
}

export function isBrowserConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return /target closed|connection closed|browser has been disconnected|protocol error|session closed|page crashed/i.test(
    message,
  );
}

export async function withPdfPage<T>(
  run: (page: Page) => Promise<T>,
  retries = 2,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let page: Page | null = null;
    let activeBrowser: Browser | null = null;

    try {
      activeBrowser = await getBrowser();
      page = await activeBrowser.newPage();

      return await run(page);
    } catch (error) {
      lastError = error;

      if (!isBrowserConnectionError(error) || attempt === retries) {
        throw error;
      }

      if (activeBrowser && !activeBrowser.connected) {
        resetBrowser(activeBrowser);
      }
    } finally {
      if (page && !page.isClosed()) {
        await page.close().catch(() => undefined);
      }
    }
  }

  throw lastError;
}
