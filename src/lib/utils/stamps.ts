const STAMP_URLS = ['/stamps/turtle-1.svg', '/stamps/turtle-2.svg', '/stamps/turtle-3.svg'];

let cache: Promise<HTMLImageElement[]> | null = null;

export function loadStamps(): Promise<HTMLImageElement[]> {
  if (typeof Image === 'undefined') return Promise.resolve([]);
  if (cache) return cache;
  cache = Promise.all(
    STAMP_URLS.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load stamp ${src}`));
          img.src = src;
        })
    )
  );
  return cache;
}
