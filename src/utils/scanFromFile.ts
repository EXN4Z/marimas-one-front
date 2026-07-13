import jsQR from 'jsqr';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

async function decodeFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height);
  return result?.data ?? null;
}

async function decodeFromImageFile(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      decodeFromCanvas(canvas).then(resolve).catch(reject);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function decodeFromPdfFile(file: File): Promise<string | null> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas }).promise;

    const result = await decodeFromCanvas(canvas);
    if (result) return result; // ketemu di halaman ini, stop
  }
  return null;
}

export async function decodeQrFromFile(file: File): Promise<string> {
  let result: string | null = null;

  if (file.type === 'application/pdf') {
    result = await decodeFromPdfFile(file);
  } else if (file.type.startsWith('image/')) {
    result = await decodeFromImageFile(file);
  } else {
    throw new Error('Format file tidak didukung. Pakai PNG, JPG, atau PDF.');
  }

  if (!result) throw new Error('QR code tidak ditemukan di file ini.');
  return result;
}