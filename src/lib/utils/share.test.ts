import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shareOrDownload } from './share';

describe('shareOrDownload', () => {
  let originalShare: any;
  let originalCanShare: any;

  beforeEach(() => {
    originalShare = (navigator as any).share;
    originalCanShare = (navigator as any).canShare;
  });

  afterEach(() => {
    (navigator as any).share = originalShare;
    (navigator as any).canShare = originalCanShare;
  });

  it('uses navigator.share when canShare returns true', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    (navigator as any).canShare = () => true;
    (navigator as any).share = shareSpy;

    const blob = new Blob(['x'], { type: 'image/png' });
    await shareOrDownload(blob, { title: 't', text: 'hi' });

    expect(shareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy.mock.calls[0][0].title).toBe('t');
  });

  it('falls back to download when canShare returns false', async () => {
    (navigator as any).canShare = () => false;
    (navigator as any).share = vi.fn();
    const downloadSpy = vi.fn();

    const blob = new Blob(['x'], { type: 'image/png' });
    await shareOrDownload(blob, { title: 't', text: 'hi' }, downloadSpy);

    expect((navigator as any).share).not.toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalledWith(blob, expect.any(String));
  });

  it('falls back to download when navigator.share is missing', async () => {
    delete (navigator as any).canShare;
    delete (navigator as any).share;
    const downloadSpy = vi.fn();

    const blob = new Blob(['x'], { type: 'image/png' });
    await shareOrDownload(blob, { title: 't', text: 'hi' }, downloadSpy);

    expect(downloadSpy).toHaveBeenCalled();
  });

  it('silently handles AbortError from share', async () => {
    (navigator as any).canShare = () => true;
    const err = new Error('User aborted');
    err.name = 'AbortError';
    (navigator as any).share = vi.fn().mockRejectedValue(err);

    const blob = new Blob(['x'], { type: 'image/png' });
    await expect(
      shareOrDownload(blob, { title: 't', text: 'hi' })
    ).resolves.toBeUndefined();
  });
});
