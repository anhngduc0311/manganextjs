import fs from "fs";
import path from "path";
import sharp from "sharp";

const iconsDir = path.resolve(process.cwd(), "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgBuffer = Buffer.from(`
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="#09090b"/>
  <rect x="32" y="32" width="448" height="448" rx="96" fill="url(#grad)" filter="url(#shadow)"/>
  <text x="256" y="340" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="280" fill="#ffffff" text-anchor="middle">K</text>
</svg>
`);

async function generate() {
  console.log("🎨 Generating PWA and app icons in public/icons/...");

  // 1. icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));

  // 2. icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512.png"));

  // 3. icon-maskable.png (192 & 512)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-192.png"));

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512.png"));

  // 4. Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  // 5. Favicon (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(iconsDir, "favicon-32x32.png"));

  console.log("✅ All icons generated successfully in public/icons/!");
}

generate().catch((err) => {
  console.error("Icon generation error:", err);
  process.exit(1);
});
