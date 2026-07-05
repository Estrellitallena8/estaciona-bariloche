import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const jobs = [
  { src: "icon-source.svg", out: "pwa-192x192.png", size: 192 },
  { src: "icon-source.svg", out: "pwa-512x512.png", size: 512 },
  { src: "icon-source.svg", out: "apple-touch-icon.png", size: 180, flatten: "#0b1220" },
  { src: "icon-maskable-source.svg", out: "maskable-icon-512x512.png", size: 512 },
];

for (const job of jobs) {
  const srcPath = path.join(__dirname, job.src);
  let pipeline = sharp(srcPath).resize(job.size, job.size);
  if (job.flatten) pipeline = pipeline.flatten({ background: job.flatten });
  await pipeline.png().toFile(path.join(publicDir, job.out));
  console.log(`Generado public/${job.out} (${job.size}x${job.size})`);
}
