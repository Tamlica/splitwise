import { OcrRow, OcrWord } from './types';

const UPSCALE = 2;
const MIN_CONFIDENCE = 20;
// Thumbnail captions and icons are much smaller than the UI text; drop them.
const MIN_HEIGHT_RATIO = 0.55;
const ROW_TOLERANCE_RATIO = 0.6;

async function upscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width * UPSCALE;
  canvas.height = bitmap.height * UPSCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not prepare image'))), 'image/png')
  );
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

export async function runOcr(file: File, onProgress?: (fraction: number) => void): Promise<OcrRow[]> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['ind', 'eng'], 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress?.(m.progress);
    },
  });

  try {
    const image = await upscale(file);
    const { data } = await worker.recognize(image, {}, { blocks: true });

    const words: OcrWord[] = [];
    for (const block of data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          for (const word of line.words) {
            const text = word.text.trim();
            if (!text || word.confidence < MIN_CONFIDENCE) continue;
            words.push({ text, ...word.bbox });
          }
        }
      }
    }
    return groupIntoRows(words);
  } finally {
    await worker.terminate();
  }
}
