import { OcrRow, OcrWord } from './types';

const UPSCALE = 2;
const MIN_CONFIDENCE = 20;
// Thumbnail captions and icons are much smaller than the UI text; drop them.
const MIN_HEIGHT_RATIO = 0.55;
const ROW_TOLERANCE_RATIO = 0.6;

// Very tall images (scrolling screenshots) are cut into overlapping strips: browsers cap canvas
// size, and Tesseract slows down and loses accuracy on huge pages. Sizes are source pixels.
const MAX_SIDE = 8000;
const TALL_THRESHOLD = 4000;
const STRIP_HEIGHT = 2000;
const STRIP_OVERLAP = 100;

interface Strip {
  blob: Blob;
  /** Vertical offset of the strip within the upscaled image. */
  offset: number;
  /** Words whose centre falls outside [keepFrom, keepTo) belong to a neighbouring strip. */
  keepFrom: number;
  keepTo: number;
}

async function prepareStrips(file: File): Promise<Strip[]> {
  const bitmap = await createImageBitmap(file);
  try {
    const tall = bitmap.height > TALL_THRESHOLD;
    const stripSource = tall ? STRIP_HEIGHT + STRIP_OVERLAP : bitmap.height;
    const scale = Math.min(UPSCALE, MAX_SIDE / Math.max(bitmap.width, stripSource));

    const strips: Strip[] = [];
    let origin = 0;
    while (origin < bitmap.height) {
      const end = tall ? Math.min(bitmap.height, origin + STRIP_HEIGHT + STRIP_OVERLAP) : bitmap.height;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round((end - origin) * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available in this browser');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, origin, bitmap.width, end - origin, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not prepare image'))), 'image/png')
      );
      // Strips overlap by STRIP_OVERLAP; each side keeps words up to the middle of the overlap.
      const seam = STRIP_OVERLAP / 2;
      strips.push({
        blob,
        offset: origin * scale,
        keepFrom: origin === 0 ? -Infinity : (origin + seam) * scale,
        keepTo: end === bitmap.height ? Infinity : (origin + STRIP_HEIGHT + seam) * scale,
      });
      if (end === bitmap.height) break;
      origin += STRIP_HEIGHT;
    }
    return strips;
  } finally {
    bitmap.close();
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export function groupIntoRows(words: OcrWord[]): OcrRow[] {
  if (words.length === 0) return [];
  const typicalHeight = median(words.map((w) => w.y1 - w.y0));
  const kept = words.filter((w) => w.y1 - w.y0 >= typicalHeight * MIN_HEIGHT_RATIO);

  const centre = (w: OcrWord) => (w.y0 + w.y1) / 2;
  const sorted = [...kept].sort((a, b) => centre(a) - centre(b));

  const groups: OcrWord[][] = [];
  let groupCentre = -Infinity;
  for (const word of sorted) {
    if (groups.length > 0 && Math.abs(centre(word) - groupCentre) < typicalHeight * ROW_TOLERANCE_RATIO) {
      const group = groups[groups.length - 1];
      group.push(word);
      groupCentre = group.reduce((sum, w) => sum + centre(w), 0) / group.length;
    } else {
      groups.push([word]);
      groupCentre = centre(word);
    }
  }

  return groups.map((group) => {
    const ordered = group.sort((a, b) => a.x0 - b.x0);
    return { text: ordered.map((w) => w.text).join(' '), words: ordered };
  });
}

/**
 * OCRs each file with one shared worker (loading the language data is the slow part).
 * `onProgress` reports the 0-based file index and that file's progress from 0 to 1.
 */
export async function runOcrBatch(
  files: File[],
  onProgress?: (fileIndex: number, fraction: number) => void
): Promise<OcrRow[][]> {
  const { createWorker } = await import('tesseract.js');
  const position = { file: 0, strip: 0, strips: 1 };
  const worker = await createWorker(['ind', 'eng'], 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(position.file, (position.strip + m.progress) / position.strips);
      }
    },
  });

  try {
    const results: OcrRow[][] = [];
    for (let f = 0; f < files.length; f++) {
      const strips = await prepareStrips(files[f]);
      const words: OcrWord[] = [];
      position.file = f;
      position.strips = strips.length;

      for (let s = 0; s < strips.length; s++) {
        position.strip = s;
        const { blob, offset, keepFrom, keepTo } = strips[s];
        const { data } = await worker.recognize(blob, {}, { blocks: true });

        for (const block of data.blocks ?? []) {
          for (const paragraph of block.paragraphs) {
            for (const line of paragraph.lines) {
              for (const word of line.words) {
                const text = word.text.trim();
                if (!text || word.confidence < MIN_CONFIDENCE) continue;
                const { x0, x1, y0, y1 } = word.bbox;
                const centre = (y0 + y1) / 2 + offset;
                if (centre < keepFrom || centre >= keepTo) continue;
                words.push({ text, x0, x1, y0: y0 + offset, y1: y1 + offset });
              }
            }
          }
        }
      }
      onProgress?.(f, 1);
      results.push(groupIntoRows(words));
    }
    return results;
  } finally {
    await worker.terminate();
  }
}
