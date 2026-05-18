import { makeSafeExportText, renderSafeExportSvg, type SafeExportSummary } from './safeExport';

export async function copySafeExportText(summary: SafeExportSummary, filename: string): Promise<'clipboard' | 'download'> {
  const text = makeSafeExportText(summary);

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return 'clipboard';
  }

  downloadText(text, filename);
  return 'download';
}

export async function exportSafePng(summary: SafeExportSummary, filename: string): Promise<void> {
  const svg = renderSafeExportSvg(summary);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('PNG export is not supported in this browser.');
    }

    context.fillStyle = '#0d1114';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    const pngUrl = canvas.toDataURL('image/png');
    triggerDownload(pngUrl, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to render safe export image.'));
    image.src = url;
  });
}

function downloadText(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  try {
    triggerDownload(url, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
