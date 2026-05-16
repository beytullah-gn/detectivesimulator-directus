import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DIRECTUS_URL = (process.env.DIRECTUS_URL || "http://127.0.0.1:8057").replace(/\/$/, "");
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || process.env.BOOTSTRAP_TOKEN || "";

if (!DIRECTUS_TOKEN) {
  throw new Error("DIRECTUS_TOKEN or BOOTSTRAP_TOKEN must be provided.");
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const coverDir = path.resolve(scriptDir, "../../detectivesimulator/public/case-covers");

const covers = [
  { slug: "galata-patent-dosyasi", filename: "galata-patent-dosyasi.svg", title: "Galata Patent Dosyası Cover" },
  { slug: "maslak-veri-sizintisi", filename: "maslak-veri-sizintisi.svg", title: "Maslak Veri Sizintisi Cover" },
  { slug: "pera-galeri-gecesi", filename: "pera-galeri-gecesi.svg", title: "Pera Galeri Gecesi Cover" },
  { slug: "nisantasi-heykel-degisimi", filename: "nisantasi-heykel-degisimi.svg", title: "Nisantasi Heykel Degisimi Cover" },
  { slug: "karakoy-konteyner-dosyasi", filename: "karakoy-konteyner-dosyasi.svg", title: "Karakoy Konteyner Dosyasi Cover" },
  { slug: "ambar-17-sapmasi", filename: "ambar-17-sapmasi.svg", title: "Ambar 17 Sapmasi Cover" },
];

function log(message) {
  console.log(`[covers] ${message}`);
}

async function api(pathname, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${DIRECTUS_URL}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      ...headers,
    },
    body,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `${method} ${pathname} failed: ${payload?.errors?.[0]?.message || payload?.error || response.statusText}`
    );
  }

  return payload;
}

async function findFileByName(filename) {
  const payload = await api(
    `/files?filter[filename_download][_eq]=${encodeURIComponent(filename)}&fields=id,filename_download,title&limit=1`
  );

  return payload?.data?.[0] || null;
}

async function uploadCover({ filename, title }) {
  const existingFile = await findFileByName(filename);
  if (existingFile) {
    return existingFile.id;
  }

  const fileBuffer = await readFile(path.join(coverDir, filename));
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", new Blob([fileBuffer], { type: "image/svg+xml" }), filename);

  const payload = await api("/files", {
    method: "POST",
    body: formData,
  });

  return payload?.data?.id || payload?.data;
}

async function findScenarioBySlug(slug) {
  const payload = await api(
    `/items/scenarios?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=id,title,cover_image&limit=1`
  );

  return payload?.data?.[0] || null;
}

async function main() {
  for (const cover of covers) {
    const scenario = await findScenarioBySlug(cover.slug);
    if (!scenario) {
      throw new Error(`Scenario not found for slug ${cover.slug}`);
    }

    const fileId = await uploadCover(cover);

    if (scenario.cover_image === fileId) {
      log(`Already linked: ${cover.slug}`);
      continue;
    }

    await api(`/items/scenarios/${scenario.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        cover_image: fileId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    log(`Linked cover: ${cover.slug}`);
  }

  log("Cover sync completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
