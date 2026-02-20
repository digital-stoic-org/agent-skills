#!/usr/bin/env bun
/**
 * AntV Infographic SSR renderer
 * Usage: bun run render.ts <syntax-file> <output.svg> [--preview]
 */
import { renderToString } from "@antv/infographic/ssr";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import "@antv/infographic";

const [syntaxFile, outputPath, ...flags] = Bun.argv.slice(2);

if (!syntaxFile || !outputPath) {
  console.error("Usage: bun run render.ts <syntax-file> <output.svg> [--preview]");
  process.exit(1);
}

// Read AntV syntax from file
const syntax = readFileSync(syntaxFile, "utf-8");

// Ensure output directory exists
mkdirSync(dirname(outputPath), { recursive: true });

try {
  const svg = await renderToString(syntax);
  writeFileSync(outputPath, svg);
  console.log(`✅ Rendered → ${outputPath}`);
} catch (e: any) {
  console.error(`❌ Render failed: ${e.message}`);
  process.exit(1);
}

// Auto-preview in VS Code if requested
if (flags.includes("--preview")) {
  try {
    Bun.spawnSync(["code", "--reuse-window", outputPath]);
    console.log(`🔍 Opened preview in VS Code`);
  } catch {
    console.log(`⚠️ VS Code preview unavailable — open manually: ${outputPath}`);
  }
}
