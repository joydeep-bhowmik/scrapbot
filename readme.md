# ScrapBot

A data scraping tool built with Node.js and Puppeteer for extracting business information from Google Maps and Justdial. This project was created as a learning exercise in web scraping.

## Features

- Scrape business listings from Google Maps and Justdial
- Extract key information: name, website, phone number, address, rating
- Output data to CSV files with timestamps
- Stealth mode to avoid detection
- Interactive CLI for selecting scraper and entering search queries

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd scrapbot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Run the scraper:
```bash
node main.js
```

1. Select a scraper by entering the corresponding number:
   - GoogleMaps[1]
   - Justdial[2]

2. Enter your search query (e.g., "restaurants in New York")

3. The scraper will launch a browser, perform the search, and extract data

4. Results will be saved to a CSV file in the `outputs/` directory with a timestamp

## Dependencies

- **Puppeteer**: For browser automation
- **puppeteer-extra-plugin-stealth**: To avoid detection
- **csv-writer**: For generating CSV output
- **ora**: For CLI spinners
- **prompt-sync**: For user input

## Project Structure

```
scrapbot/
├── main.js                 # Entry point
├── package.json            # Dependencies and scripts
├── src/
│   ├── scrapers/
│   │   ├── index.js        # Scraper registry
│   │   ├── googleMaps.js   # Google Maps scraper
│   │   └── justdial.js     # Justdial scraper
│   └── utils/
│       ├── cleanData.js    # Data cleaning utilities
│       ├── delay.js        # Delay utilities
│       ├── make-csv.js     # CSV generation
│       └── waitForNewElements.js # DOM waiting utilities
└── outputs/                # Generated CSV files
```

## Disclaimer

This tool is for educational purposes only. Please respect the terms of service of the websites you scrape and ensure compliance with applicable laws and regulations regarding web scraping.
