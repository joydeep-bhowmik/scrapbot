import ora from "ora";
import path from "path";
import { scrapers, scrapersNames } from "./src/scrapers/index.js";
import { jsonToCsv } from "./src/utils/make-csv.js";
import PromptSync from "prompt-sync";

const spinner = ora();
let results = [];
const prompt = PromptSync();
spinner.start("staring...");
const source = prompt(`Select Scrapper : [${scrapersNames.join(" / ")}] `) || 2;

const scraper = scrapers.find((s) => s.id == source);

if (!(scraper && scraper.scraper)) {
  spinner.fail("Invalid source");
  process.exit(1);
}

const options = { headless: false };

results = await scraper.scraper(options);

if (!results) {
  spinner.fail("No results found");
  process.exit(1);
}

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
// Correct way to go one directory up
const filePath = path.join("outputs", `${source}-${timestamp}.csv`);

// Sanitize only the filename part (not the whole path)
const dir = path.dirname(filePath);
const filename = path.basename(filePath);
const sanitizedFilename = filename
  .replace(/[<>:"/\\|?*]+/g, "")
  .trim()
  .split(" ")
  .join("-");
const sanitizedFilePath = path.join(dir, sanitizedFilename);

jsonToCsv(results, sanitizedFilePath);

// Convert to file URL
const absolutePath = path.resolve(sanitizedFilePath);
const fileUrl = `file://${absolutePath.replace(/\\/g, "/")}`;

spinner.succeed(` Done -> ${fileUrl}`);
