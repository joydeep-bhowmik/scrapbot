import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { delay } from "../utils/delay.js";
import PromptSync from "prompt-sync";
puppeteer.use(StealthPlugin());

export async function scrapeGoogleMaps(options) {
  const prompt = PromptSync();
  const query = prompt("Search: ") || "restaurant in kumarghat";
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.exposeFunction("delay", delay);
  await page.setViewport({ width: 1280, height: 800 });

  const url =
    "https://www.google.com/maps/search/" + query.trim().split(" ").join("+");

  await page.goto(url, { waitUntil: ["domcontentloaded", "networkidle2"] });

  const results = [];

  if (page.url().includes("/place/")) {
    await page.waitForSelector('[style="width: 480px;"]');
    const data = await page.evaluate(() => {
      const itemContainer = document.querySelector('[style="width: 480px;"]');
      if (!itemContainer) return null;

      return {
        name: itemContainer.querySelector("h1")?.innerText,
        website: itemContainer.querySelector('[data-item-id="authority"]')
          ?.href,
        phone_number: itemContainer.querySelector(
          '[data-item-id^="phone:tel:"] .Io6YTe',
        )?.innerText,
        address: itemContainer.querySelector('[data-item-id="address"]')
          ?.innerText,
        rating: itemContainer.querySelector('.F7nice [aria-hidden="true"]')
          ?.innerText,
        url: document.location.href,
      };
    });

    results.push(data);
  } else {
    await page.waitForSelector('[role="feed"]');
    await page.waitForSelector('[role="article"]');
    await page.evaluate(async () => {
      async function waitForNewElements({
        container,
        selector,
        prevCount,
        timeout = 5000,
      }) {
        return new Promise((resolve) => {
          const observer = new MutationObserver(() => {
            const newCount = container.querySelectorAll(selector).length;
            if (newCount > prevCount) {
              observer.disconnect();
              resolve(newCount);
            }
          });

          observer.observe(container, { childList: true, subtree: true });

          // fallback timeout (important, or it might hang forever)
          setTimeout(() => {
            observer.disconnect();
            resolve(prevCount);
          }, timeout);
        });
      }

      const container = document.querySelector('[role="feed"]');
      if (!container) return;

      while (true) {
        const prevCount = container.querySelectorAll('[role="article"]').length;

        container.scrollTop = container.scrollHeight;

        const newCount = await waitForNewElements({
          container,
          selector: '[role="article"]',
          prevCount,
        });

        if (
          container.textContent.includes("You've reached the end of the list")
        ) {
          break;
        }
      }
    });

    const items = await page.$$('[role="article"]');

    for (let i = 0; i < items.length; i++) {
      const freshItems = await page.$$('[role="article"]');
      const item = freshItems[i];
      if (!item) break;

      await item.click();
      await page.waitForSelector('[style="width: 360px;"]');

      const data = await page.evaluate(() => {
        const itemContainer = document.querySelector('[style="width: 360px;"]');
        if (!itemContainer) return null;

        return {
          name: itemContainer.querySelector("h1")?.innerText,
          website: itemContainer.querySelector('[data-item-id="authority"]')
            ?.href,
          phone_number: itemContainer.querySelector(
            '[data-item-id^="phone:tel:"] .Io6YTe',
          )?.innerText,
          address: itemContainer.querySelector('[data-item-id="address"]')
            ?.innerText,
          rating: itemContainer.querySelector('.F7nice [aria-hidden="true"]')
            ?.innerText,
          url: document.location.href,
        };
      });

      results.push(data);
    }
  }

  await browser.close();
  return results;
}
