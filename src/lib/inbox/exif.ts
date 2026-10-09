/** Best-effort DateTimeOriginal from EXIF ASCII in JPEG/HEIC/TIFF buffers. */
export function extractCapturedAt(buffer: Buffer, fallback?: Date): Date {
  const fromExif = parseExifDate(buffer);
  return fromExif ?? fallback ?? new Date();
}

/** EXIF lives in the file header; never decode a whole 500 MB video as text. */
const EXIF_SCAN_BYTES = 256 * 1024;

export function parseExifDate(buffer: Buffer): Date | null {
  const text = buffer.subarray(0, EXIF_SCAN_BYTES).toString("latin1");
  const match = text.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const date = new Date(
    year,
    month - 1,
    day,
    Number(h),
    Number(mi),
    Number(s)
  );
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
