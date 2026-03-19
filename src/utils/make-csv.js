import path from "path";
import fs from "fs";
import { cleanData } from "./cleanData.js";

export function jsonToCsv(data, filePath = null) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Invalid or empty data");
  }

  // Clean data first
  data = cleanData(data);
  if (!data.length) {
    throw new Error("No valid data after cleaning");
  }

  // Get all unique headers
  const headers = [...new Set(data.flatMap((obj) => Object.keys(obj)))];

  // Build CSV rows
  const csvRows = [
    headers.join(","), // header row
    ...data.map((obj) =>
      headers
        .map((header) => {
          let value = obj[header] ?? "";

          // Remove unwanted characters
          value = String(value)
            .replace(/\uFFFD|\uE000/g, "")
            .trim();

          // Escape quotes
          value = value.replace(/"/g, '""');

          // Wrap in quotes if necessary
          if (value.includes(",") || value.includes("\n")) {
            value = `"${value}"`;
          }

          return value;
        })
        .join(","),
    ),
  ];

  const csv = csvRows.join("\n");

  // Write to file if filePath provided
  if (filePath) {
    // Convert to absolute path (safe)
    const absPath = path.resolve(filePath);

    // Ensure folder exists
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absPath, csv);
  }

  return csv;
}
