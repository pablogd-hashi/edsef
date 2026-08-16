import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import os from "os";
import path from "path";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

export async function convertHeicWithSips(inputPath: string): Promise<Buffer | null> {
  if (process.platform !== "darwin") return null;
  const out = path.join(
    os.tmpdir(),
    `memoria-heic-${Date.now()}-${path.basename(inputPath)}.jpg`
  );
  try {
    await execFileAsync("sips", ["-s", "format", "jpeg", inputPath, "--out", out]);
    return await fs.readFile(out);
  } catch {
    return null;
  } finally {
    await fs.unlink(out).catch(() => undefined);
  }
}

export async function generateImageVariants(
  buffer: Buffer,
  sourcePath?: string
): Promise<{
  width?: number;
  height?: number;
  webBuf?: Buffer;
  thumbBuf?: Buffer;
}> {
  const fromSharp = await trySharpVariants(buffer);
  if (fromSharp.webBuf) return fromSharp;

  if (sourcePath) {
    const converted = await convertHeicWithSips(sourcePath);
    if (converted) {
      const fromSips = await trySharpVariants(converted);
      if (fromSips.webBuf) {
        return {
          ...fromSips,
          width: fromSips.width ?? fromSharp.width,
          height: fromSips.height ?? fromSharp.height,
        };
      }
    }
  }

  return fromSharp;
}

async function trySharpVariants(buffer: Buffer) {
  try {
    const meta = await sharp(buffer).metadata();
    const webBuf = await sharp(buffer)
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const thumbBuf = await sharp(buffer)
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return {
      width: meta.width,
      height: meta.height,
      webBuf,
      thumbBuf,
    };
  } catch {
    return {};
  }
}
