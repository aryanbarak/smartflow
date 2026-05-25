import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, "../public/dailyflow-icon.svg");
const svg = readFileSync(svgPath, "utf8");

for (const size of [192, 512]) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  const png = resvg.render().asPng();
  const outPath = resolve(__dirname, `../public/pwa-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`Generated pwa-${size}.png`);
}
