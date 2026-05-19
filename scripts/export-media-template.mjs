import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const manifestPath = path.resolve(process.argv[2] || "assets/media-manifest.json");
const outputPath = path.resolve(process.argv[3] || "assets/media-template.csv");

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Manifest not found: ${manifestPath}. Run npm run media:manifest first.`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const rows = [];
rows.push("type,slug,image_url,hero_image_url,portrait_url,tagline,quote,city,country,source_url");

for (const perfume of manifest.perfumes || []) {
  rows.push(
    [
      "perfume",
      perfume.slug || "",
      "",
      "",
      "",
      "",
      "",
      "",
      perfume.country || "",
      "",
    ].join(","),
  );
}

for (const brand of manifest.brands || []) {
  rows.push(
    [
      "brand",
      brand.slug || "",
      "",
      "",
      "",
      "",
      "",
      "",
      brand.country || "",
      "",
    ].join(","),
  );
}

for (const perfumer of manifest.perfumers || []) {
  rows.push(
    [
      "perfumer",
      perfumer.slug || "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ].join(","),
  );
}

fs.writeFileSync(outputPath, `${rows.join("\n")}\n`, "utf8");
console.log(`Media template CSV written to ${outputPath}`);
