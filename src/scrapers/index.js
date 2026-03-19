import { scrapeGoogleMaps } from "./googleMaps.js";
import { scrapeJustdial } from "./justdial.js";
export const scrapers = [
  {
    id: 1,
    name: "GoogleMaps",
    scraper: scrapeGoogleMaps,
  },
  {
    id: 2,
    name: "Justdial",
    scraper: scrapeJustdial,
  },
];

export const scrapersNames = scrapers.map((s) => `${s.name}[${s.id}]`);
