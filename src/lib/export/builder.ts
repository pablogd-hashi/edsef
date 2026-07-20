import fs from "fs/promises";
import path from "path";
import archiver from "archiver";
import { createWriteStream } from "fs";
import { prisma } from "@/lib/db/prisma";
import { yearbookService } from "@/lib/services/yearbook.service";
import {
  STORAGE_ROOT,
  ensureDir,
  exportAssetFilename,
  sanitizeExtension,
  fileExists,
} from "@/lib/storage/local";
import { EXPORT_SCHEMA_VERSION } from "@/domain/types";
import type { MediaAsset, MediaType } from "@prisma/client";

export interface ExportMediaRef {
  assetId: string;
  exportPath: string;
  type: MediaType;
  checksum: string | null;
}

export interface ExportBuildResult {
  exportDir: string;
  zipPath: string;
  htmlPath: string;
  pdfPath: string | null;
  mediaRefs: ExportMediaRef[];
}

type YearbookData = NonNullable<Awaited<ReturnType<typeof yearbookService.getById>>>;

export async function buildYearbookExport(
  yearbookId: string,
  childId: string,
  familyId: string,
  options: { includePdf?: boolean } = {}
): Promise<ExportBuildResult> {
  const yearbook = await yearbookService.getById(yearbookId, childId);
  if (!yearbook) throw new Error("Yearbook not found");

  const slug = `${yearbook.child.nickname ?? yearbook.child.fullName}-${yearbook.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const timestamp = new Date().toISOString().slice(0, 10);
  const exportRoot = path.join(STORAGE_ROOT, "exports", familyId, `${slug}-${timestamp}`);
  const htmlDir = path.join(exportRoot, "html");
  const assetsDir = path.join(htmlDir, "assets");
  const imagesDir = path.join(assetsDir, "images");
  const videosDir = path.join(assetsDir, "videos");
  const dataDir = path.join(exportRoot, "data");
  const pdfDir = path.join(exportRoot, "pdf");

  await ensureDir(imagesDir);
  await ensureDir(videosDir);
  await ensureDir(dataDir);
  await ensureDir(pdfDir);

  const mediaRefs: ExportMediaRef[] = [];
  const assetMap = new Map<string, string>();

  async function copyAsset(
    asset: MediaAsset & { variants?: { variant: string; storageKey: string }[] }
  ): Promise<string | null> {
    if (assetMap.has(asset.id)) return assetMap.get(asset.id)!;

    let storageKey = asset.storageKey;
    if (asset.type === "IMAGE" && asset.variants?.length) {
      const web = asset.variants.find((v) => v.variant === "WEB");
      if (web) storageKey = web.storageKey;
    }

    const srcPath = path.join(STORAGE_ROOT, storageKey);
    if (!(await fileExists(srcPath))) return null;

    const ext = sanitizeExtension(asset.originalFilename, asset.mimeType);
    const exportRel = exportAssetFilename(asset.id, asset.type, ext);
    const destPath = path.join(htmlDir, exportRel);
    await ensureDir(path.dirname(destPath));
    await fs.copyFile(srcPath, destPath);

    assetMap.set(asset.id, exportRel);
    mediaRefs.push({
      assetId: asset.id,
      exportPath: exportRel,
      type: asset.type,
      checksum: asset.checksum,
    });
    return exportRel;
  }

  // Collect all media from milestones and timeline
  for (const m of yearbook.milestones) {
    for (const link of m.media) {
      await copyAsset(link.media);
    }
  }
  for (const t of yearbook.timeline) {
    for (const link of t.media) {
      await copyAsset(link.media);
    }
  }

  const html = generateOfflineHtml(yearbook, assetMap);
  const css = generateExportCss();
  const htmlPath = path.join(htmlDir, "index.html");
  const cssPath = path.join(htmlDir, "styles.css");
  await fs.writeFile(htmlPath, html, "utf-8");
  await fs.writeFile(cssPath, css, "utf-8");

  const jsonPath = path.join(dataDir, "yearbook.json");
  await fs.writeFile(
    jsonPath,
    JSON.stringify(
      {
        schemaVersion: EXPORT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        yearbookId: yearbook.id,
        child: yearbook.child.fullName,
        title: yearbook.title,
        mediaRefs,
      },
      null,
      2
    ),
    "utf-8"
  );

  const readme = generateReadme(yearbook.child.fullName, yearbook.title);
  await fs.writeFile(path.join(exportRoot, "README.md"), readme, "utf-8");

  const manifest = {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    files: mediaRefs.map((m) => ({
      path: `html/${m.exportPath}`,
      checksum: m.checksum,
      type: m.type,
    })),
  };
  await fs.writeFile(
    path.join(exportRoot, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );

  let pdfPath: string | null = null;
  if (options.includePdf !== false) {
    pdfPath = path.join(pdfDir, "yearbook.pdf");
    try {
      await generatePdfFromHtml(htmlPath, pdfPath, path.dirname(htmlPath));
    } catch (e) {
      console.warn("PDF generation skipped:", e);
      pdfPath = null;
    }
  }

  const zipPath = path.join(STORAGE_ROOT, "exports", familyId, `${slug}-${timestamp}.zip`);
  await createZip(exportRoot, zipPath);

  return { exportDir: exportRoot, zipPath, htmlPath, pdfPath, mediaRefs };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateOfflineHtml(
  yearbook: YearbookData,
  assetMap: Map<string, string>
): string {
  const summary = yearbook.summaryContent as Record<string, unknown> | null;
  const coverTitle = yearbook.customCoverTitle ?? yearbook.title;

  let milestonesHtml = "";
  for (const m of yearbook.milestones) {
    let mediaHtml = '<div class="media-grid">';
    for (const link of m.media) {
      const p = assetMap.get(link.media.id);
      if (!p) continue;
      if (link.media.type === "VIDEO") {
        mediaHtml += `<video controls preload="metadata" src="${p}"></video>`;
      } else {
        mediaHtml += `<img src="${p}" alt="${esc(m.title)}" loading="lazy" />`;
      }
    }
    mediaHtml += "</div>";

    milestonesHtml += `
      <article class="milestone">
        ${m.ageLabel ? `<p class="age-label">${esc(m.ageLabel)}</p>` : ""}
        <h3>${esc(m.title)}</h3>
        ${m.description ? `<p>${esc(m.description)}</p>` : ""}
        ${mediaHtml}
      </article>`;
  }

  let storiesHtml = "";
  for (const s of yearbook.stories) {
    const content = s.content as { content?: { type: string; content?: { text?: string }[] }[] };
    let body = "";
    for (const node of content?.content ?? []) {
      if (node.type === "paragraph") {
        body += `<p>${esc(node.content?.map((c) => c.text ?? "").join("") ?? "")}</p>`;
      } else if (node.type === "blockquote") {
        body += `<blockquote>${esc(node.content?.map((c) => c.text ?? "").join("") ?? "")}</blockquote>`;
      } else if (node.type === "heading") {
        body += `<h3>${esc(node.content?.map((c) => c.text ?? "").join("") ?? "")}</h3>`;
      }
    }
    storiesHtml += `<article class="story"><h2>${esc(s.title)}</h2>${body}</article>`;
  }

  let timelineHtml = "";
  for (const t of yearbook.timeline) {
    let mediaHtml = "";
    for (const link of t.media) {
      const p = assetMap.get(link.media.id);
      if (!p) continue;
      if (link.media.type === "VIDEO") {
        mediaHtml += `<video controls preload="metadata" src="${p}"></video>`;
      } else {
        mediaHtml += `<img src="${p}" alt="" loading="lazy" />`;
      }
    }
    timelineHtml += `
      <div class="timeline-item">
        <time>${new Date(t.eventDate).toLocaleDateString("es")}</time>
        <h4>${esc(t.title)}</h4>
        ${t.description ? `<p>${esc(t.description)}</p>` : ""}
        ${mediaHtml}
      </div>`;
  }

  let summaryHtml = "";
  if (summary) {
    for (const [key, val] of Object.entries(summary)) {
      if (!val) continue;
      const label = key.replace(/([A-Z])/g, " $1").trim();
      const text = Array.isArray(val) ? val.join(" · ") : String(val);
      summaryHtml += `<div class="summary-item"><strong>${esc(label)}</strong><p>${esc(text)}</p></div>`;
    }
  }

  const letter = yearbook.futureLetter;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(coverTitle)} — ${esc(yearbook.child.fullName)}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="cover">
    <p class="child-name">${esc(yearbook.child.fullName)}</p>
    <h1>${esc(coverTitle)}</h1>
    <p class="age">${esc(yearbook.ageLabel ?? "")}</p>
  </header>
  ${summaryHtml ? `<section><h2>Resumen del año</h2><div class="summary-grid">${summaryHtml}</div></section>` : ""}
  ${milestonesHtml ? `<section><h2>Hitos</h2>${milestonesHtml}</section>` : ""}
  ${storiesHtml ? `<section><h2>Historias</h2>${storiesHtml}</section>` : ""}
  ${timelineHtml ? `<section><h2>Línea temporal</h2>${timelineHtml}</section>` : ""}
  ${letter ? `<section class="letter"><h2>Carta al futuro</h2><div class="letter-body">${esc(letter.content).replace(/\n/g, "<br/>")}</div>${letter.signature ? `<p class="signature">— ${esc(letter.signature)}</p>` : ""}</section>` : ""}
  <footer><p>Exportado con Memoria · ${new Date().toLocaleDateString("es")}</p><p class="hint">Los videos se reproducen en esta misma página. En el PDF, abre este archivo HTML para verlos.</p></footer>
</body>
</html>`;
}

function generateExportCss(): string {
  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Georgia, serif; background: #faf7f2; color: #1c1917; line-height: 1.75; }
.cover { text-align: center; padding: 4rem 1.5rem; min-height: 60vh; display: flex; flex-direction: column; justify-content: center; }
.cover h1 { font-size: 2.5rem; font-weight: 400; margin: 1rem 0; }
.child-name { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.85rem; color: #8b6f47; }
.age { color: #78716c; font-size: 1.1rem; }
section { max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem; border-top: 1px solid #e7e0d5; }
h2 { font-size: 1.75rem; font-weight: 400; margin-bottom: 2rem; }
.milestone { margin-bottom: 2.5rem; }
.age-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: #8b6f47; }
.milestone h3 { font-size: 1.35rem; margin: 0.25rem 0 0.5rem; }
.media-grid { display: grid; gap: 1rem; margin-top: 1rem; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
img, video { width: 100%; border-radius: 8px; display: block; }
blockquote { border-left: 3px solid #b8956c; padding-left: 1.25rem; margin: 1.5rem 0; font-style: italic; }
.timeline-item { margin-bottom: 1.5rem; padding-left: 1rem; border-left: 2px solid #e7e0d5; }
.timeline-item time { font-size: 0.85rem; color: #78716c; }
.letter-body { font-style: italic; font-size: 1.1rem; }
.signature { text-align: right; margin-top: 2rem; color: #8b6f47; }
.summary-grid { display: grid; gap: 1rem; }
.summary-item { background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #e7e0d5; }
footer { text-align: center; padding: 2rem; color: #78716c; font-size: 0.85rem; }
.hint { margin-top: 0.5rem; font-size: 0.8rem; }
@media print { body { background: white; } section { page-break-inside: avoid; } }
`;
}

function generateReadme(childName: string, title: string): string {
  return `# Archivo de ${childName} — ${title}

## Cómo ver este año

### Opción 1 — La más fácil (recomendada)
1. Abre la carpeta \`html\`
2. Haz doble clic en \`index.html\`
3. Se abrirá en tu navegador con fotos, videos e historias

### Opción 2 — PDF
Abre \`pdf/yearbook.pdf\` para una versión imprimible.
Los videos no se reproducen dentro del PDF — usa el HTML para verlos.

### Opción 3 — Datos completos
El archivo \`data/yearbook.json\` contiene todos los datos en formato abierto.

## Integridad
Consulta \`manifest.json\` para verificar checksums de cada archivo.

Generado por Memoria — ${new Date().toISOString()}
`;
}

async function generatePdfFromHtml(
  htmlPath: string,
  pdfPath: string,
  baseDir: string
): Promise<void> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
  } finally {
    await browser.close();
  }
}

function createZip(sourceDir: string, zipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve());
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}
