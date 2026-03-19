import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { delay } from "../utils/delay.js";
import PromptSync from "prompt-sync";
import ora from "ora";

puppeteer.use(StealthPlugin());
const prompt = PromptSync();
const spinner = ora();

export async function scrapeJustdial({ headless = true }) {
  const query = prompt("Search: ") || "restaurant in kumarghat";
  spinner.text = " searching...";
  const browser = await puppeteer.launch({ headless, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const context = browser.defaultBrowserContext();
  const url = `https://www.justdial.com`;
  await context.overridePermissions(url, ["notifications"]);

  // Navigate to Justdial
  await page.goto(url, { waitUntil: ["domcontentloaded", "networkidle2"] });

  // Fill search input and submit
  await page.type('input[aria-label="Search"]', query);
  await page.click("#srchbtn");

  // Wait for results container
  await page.waitForSelector("#mainContent", { timeout: 10000 });
  await page.waitForSelector(".resultbox", { timeout: 10000 });

  // --- Infinite scroll: load all results ---
  spinner.text = " loading more results...";
  let previousCount = 0;
  let currentCount = await page.$$eval(".resultbox", (els) => els.length);
  let maxScrollAttempts = 20; // safety limit
  let attempts = 0;

  while (attempts < maxScrollAttempts) {
    // Scroll the container
    await page.evaluate(() => {
      const container = document.querySelector("#mainContent");
      if (container) container.scrollTop = container.scrollHeight;
    });

    // Wait for potential new items to load
    await delay(2000);

    // Get new count
    currentCount = await page.$$eval(".resultbox", (els) => els.length);

    if (currentCount === previousCount) {
      // No new items loaded – assume we've reached the end
      break;
    }

    previousCount = currentCount;
    attempts++;
  }

  spinner.text = " extracting data...";

  // Get all result items as ElementHandles
  const itemHandles = await page.$$(".resultbox");
  const results = [];

  for (let i = 0; i < itemHandles.length; i++) {
    // Extract the detail page link from each item
    const link = await itemHandles[i]
      .$eval(".resultbox_title_anchorbox", (el) => el.href)
      .catch(() => null);

    if (!link) continue;

    // Open a new page for the detail view
    const detailPage = await browser.newPage();
    const uid = new Date().getTime();
    await detailPage.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36" +
        uid,
    );
    await detailPage.setExtraHTTPHeaders({
      "accept-language": "en-US,en;q=0.9",
    });
    await detailPage.setViewport({ width: 1280, height: 800 });
    await detailPage.goto(link, {
      waitUntil: ["domcontentloaded", "networkidle2"],
    });
    await delay(2000 + Math.random() * 3000);
    try {
      // Wait for key elements
      await detailPage.waitForSelector(".vendbox_rateavg ", { timeout: 5000 });
      await detailPage.waitForSelector(".vendorinfo_address", {
        timeout: 5000,
      });
      //extract the name
      const name = await detailPage
        .$eval(".vendbox_title ", (el) => el.innerText.trim())
        .catch(() => null);

      //extract website
      const website = await detailPage
        .$eval(".address_link", (el) => el.href.trim())
        .catch(() => null);

      // Extract rating and address
      const rating = await detailPage
        .$eval(".vendbox_rateavg ", (el) => el.innerText.trim())
        .catch(() => null);

      const address = await detailPage
        .$eval(".vendorinfo_address", (el) => el.innerText.trim())
        .catch(() => null);

      // Click "Show Number" button and wait for phone number to appear
      const showNumberBtn = await detailPage.$('[aria-label="Show Number"]');
      if (showNumberBtn) {
        await showNumberBtn.click();
        await delay(3000);
        await detailPage.waitForSelector('a[href^="tel:"]', { timeout: 5000 });
      }

      const phoneNumber = await detailPage
        .$eval('a[href^="tel:"]', (el) => el.innerText.trim())
        .catch(() => null);

      results.push({
        name,
        website,
        phone_number: phoneNumber,
        address,
        rating,
        url: link,
      });
    } catch (err) {
      console.warn(`Failed to extract data from ${link}:`, err.message);
    } finally {
      await detailPage.close();
    }

    // Small delay between requests to avoid detection
    await delay(1000);
  }

  await browser.close();
  return results;
}
