/**
 * Gera os ícones PNG do Yuki a partir de public/yuki-logo.svg.
 * Uso: npm run icons  (sharp já vem como optionalDependency do next)
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public", "yuki-logo.svg");

/**
 * @param {string} outFile
 * @param {number} size
 * @param {{ background?: string, coverage?: number }} options
 */
async function render(outFile, size, { background = null, coverage = 0.78 } = {}) {
  const inner = Math.round(size * coverage);
  const logo = await sharp(source, { density: 300 })
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(outFile);
}

const publicDir = path.join(root, "public");
const appDir = path.join(root, "src", "app");

await mkdir(publicDir, { recursive: true });

await render(path.join(appDir, "apple-icon.png"), 180, {
  background: "#f8f7fc",
  coverage: 0.74,
});
await render(path.join(publicDir, "icon-192.png"), 192, { coverage: 0.8 });
await render(path.join(publicDir, "icon-512.png"), 512, { coverage: 0.8 });
await render(path.join(publicDir, "icon-maskable.png"), 512, {
  background: "#f8f7fc",
  coverage: 0.58,
});

console.log("Ícones gerados: apple-icon.png, icon-192.png, icon-512.png, icon-maskable.png");
