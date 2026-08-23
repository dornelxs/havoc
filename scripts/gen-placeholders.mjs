import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public", "products");
mkdirSync(outDir, { recursive: true });

const items = [
  // Tênis
  { file: "runner-x-black", bg: "#111111", fg: "#ffffff", label: "RUNNER X" },
  { file: "runner-x-white", bg: "#f2f2f2", fg: "#111111", label: "RUNNER X" },
  { file: "runner-x-red", bg: "#8a1c1c", fg: "#ffffff", label: "RUNNER X" },
  { file: "strike-og-black", bg: "#0d0d0d", fg: "#ffffff", label: "STRIKE OG" },
  { file: "strike-og-cream", bg: "#e7e0d1", fg: "#1a1a1a", label: "STRIKE OG" },
  { file: "trail-pro-green", bg: "#243f2c", fg: "#ffffff", label: "TRAIL PRO" },
  { file: "trail-pro-grey", bg: "#3a3a3a", fg: "#ffffff", label: "TRAIL PRO" },
  { file: "sprint-elite-yellow", bg: "#c79a1e", fg: "#111111", label: "SPRINT ELITE" },
  { file: "sprint-elite-black", bg: "#111111", fg: "#ffffff", label: "SPRINT ELITE" },
  { file: "court-classic-white", bg: "#efefef", fg: "#111111", label: "COURT CLASSIC" },
  { file: "court-classic-navy", bg: "#1b2740", fg: "#ffffff", label: "COURT CLASSIC" },

  // Óculos
  { file: "shade-runner-black", bg: "#101010", fg: "#ffffff", label: "SHADE RUNNER" },
  { file: "shade-runner-tortoise", bg: "#5a3d24", fg: "#ffffff", label: "SHADE RUNNER" },
  { file: "visor-pro-black", bg: "#161616", fg: "#ffffff", label: "VISOR PRO" },
  { file: "visor-pro-blue", bg: "#1c3f8a", fg: "#ffffff", label: "VISOR PRO" },
  { file: "aviator-x-gold", bg: "#8a7327", fg: "#111111", label: "AVIATOR X" },

  // Relógios
  { file: "chrono-sport-black", bg: "#0d0d0d", fg: "#ffffff", label: "CHRONO SPORT" },
  { file: "chrono-sport-silver", bg: "#8a8a8a", fg: "#111111", label: "CHRONO SPORT" },
  { file: "pulse-gps-black", bg: "#141414", fg: "#ffffff", label: "PULSE GPS" },
  { file: "pulse-gps-red", bg: "#8a1c1c", fg: "#ffffff", label: "PULSE GPS" },
  { file: "classic-analog-brown", bg: "#4a3320", fg: "#ffffff", label: "CLASSIC ANALOG" },

  // Roupas de academia
  { file: "core-hoodie-black", bg: "#141414", fg: "#ffffff", label: "CORE HOODIE" },
  { file: "core-hoodie-grey", bg: "#7a7a7a", fg: "#111111", label: "CORE HOODIE" },
  { file: "tech-tee-white", bg: "#efefef", fg: "#111111", label: "TECH TEE" },
  { file: "tech-tee-black", bg: "#151515", fg: "#ffffff", label: "TECH TEE" },
  { file: "training-shorts-black", bg: "#101010", fg: "#ffffff", label: "TRAINING SHORTS" },
  { file: "training-shorts-navy", bg: "#1b2740", fg: "#ffffff", label: "TRAINING SHORTS" },
  { file: "flex-legging-black", bg: "#111111", fg: "#ffffff", label: "FLEX LEGGING" },
  { file: "flex-legging-wine", bg: "#5a1c2f", fg: "#ffffff", label: "FLEX LEGGING" },
  { file: "sports-bra-black", bg: "#161616", fg: "#ffffff", label: "SPORTS BRA" },
  { file: "sports-bra-sage", bg: "#5f6f5a", fg: "#ffffff", label: "SPORTS BRA" },
  { file: "track-jacket-black", bg: "#101010", fg: "#ffffff", label: "TRACK JACKET" },

  // Infantil
  { file: "kids-runner-blue", bg: "#1c3f8a", fg: "#ffffff", label: "KIDS RUNNER" },
  { file: "kids-runner-pink", bg: "#8a2f5a", fg: "#ffffff", label: "KIDS RUNNER" },
  { file: "kids-tee-yellow", bg: "#c79a1e", fg: "#111111", label: "KIDS TEE" },
  { file: "kids-tee-green", bg: "#3f7a3f", fg: "#ffffff", label: "KIDS TEE" },
  { file: "kids-track-set-navy", bg: "#1b2740", fg: "#ffffff", label: "KIDS TRACK SET" },

  // Hero / home
  { file: "hero-1", bg: "#111111", fg: "#ffffff", label: "HAVOC FW26" },
  { file: "hero-2", bg: "#1c1c1c", fg: "#ffffff", label: "NEW DROP" },

  // Lifestyle / outfit (formato retrato, sem texto de produto)
  { file: "lifestyle-1", bg: "#2b2b2b", fg: "#ffffff", label: "" },
  { file: "lifestyle-2", bg: "#4a5548", fg: "#ffffff", label: "" },
  { file: "lifestyle-3", bg: "#1b2740", fg: "#ffffff", label: "" },
  { file: "lifestyle-4", bg: "#5a1c2f", fg: "#ffffff", label: "" },

  // Avatares "para quem você está comprando"
  { file: "avatar-mulher", bg: "#3a2f4a", fg: "#ffffff", label: "" },
  { file: "avatar-homem", bg: "#243f2c", fg: "#ffffff", label: "" },
  { file: "avatar-infantil", bg: "#8a5a1e", fg: "#ffffff", label: "" },
  { file: "avatar-todos", bg: "#1c1c1c", fg: "#ffffff", label: "" },

  // Banners editoriais duplos
  { file: "editorial-academia", bg: "#243f2c", fg: "#ffffff", label: "" },
  { file: "editorial-street", bg: "#5a1c2f", fg: "#ffffff", label: "" },
];

function svg({ bg, fg, label }, { portrait = false } = {}) {
  const h = portrait ? 1500 : 1500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${h}" viewBox="0 0 1200 ${h}">
  <rect width="1200" height="${h}" fill="${bg}"/>
  <g opacity="0.08">
    <circle cx="900" cy="300" r="420" fill="${fg}"/>
  </g>
  ${
    label
      ? `<text x="60" y="1400" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="64" fill="${fg}" letter-spacing="2">${label}</text>
  <text x="60" y="1450" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="28" fill="${fg}" opacity="0.7">HAVOC</text>`
      : `<text x="60" y="1450" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="32" fill="${fg}" opacity="0.5">HAVOC</text>`
  }
</svg>`;
}

for (const item of items) {
  writeFileSync(join(outDir, `${item.file}.svg`), svg(item), "utf8");
}

console.log(`Generated ${items.length} placeholder images in ${outDir}`);
