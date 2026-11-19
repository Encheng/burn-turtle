import { toBlob } from 'html-to-image';

export type ShareMeta = { title: string; text: string };

const FILENAME = 'burn-turtle.png';

function defaultDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function shareOrDownload(
  blob: Blob,
  meta: ShareMeta,
  download: (blob: Blob, filename: string) => void = defaultDownload
): Promise<void> {
  const file = new File([blob], FILENAME, { type: 'image/png' });
  const data = { files: [file], title: meta.title, text: meta.text };

  const canUseShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare(data);

  if (canUseShare) {
    try {
      await navigator.share(data);
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // user cancelled — silent
      // Fall through to download on any other share error
    }
  }
  download(blob, FILENAME);
}

/**
 * Capture a DOM node as a 1080x1440 PNG Blob using html-to-image.
 * The node should already be styled and visible (or rendered off-screen).
 * Retries once on failure.
 */
export async function captureShareImage(node: HTMLElement): Promise<Blob> {
  const opts = {
    width: 1080,
    height: 1440,
    pixelRatio: 1,
    backgroundColor: '#ffffff',
    // Web fonts are loaded from Google Fonts (cross-origin). Embedding them
    // would pull in 100+ CJK unicode-range slices and make capture take
    // several seconds on mobile; the talisman text falls back to the system
    // serif stack in the exported image instead.
    skipFonts: true
  };
  try {
    const blob = await toBlob(node, opts);
    if (!blob) throw new Error('toBlob returned null');
    return blob;
  } catch {
    const blob = await toBlob(node, opts);
    if (!blob) throw new Error('toBlob retry returned null');
    return blob;
  }
}
