// lib/browser.ts

import puppeteer, {
 type Browser,
} from "puppeteer";

let browser: Browser | null = null;

export async function getBrowser() {

  if (browser) {
    return browser;
  }

  browser = await puppeteer.launch({
    headless: true,

    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  return browser;
}
