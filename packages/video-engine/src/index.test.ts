import { describe, expect, it } from 'vitest';
import { buildSceneFilter } from './index.js';

describe('video render filter', () => {
  it('formats portrait video with branding and readable captions', () => {
    const filter = buildSceneFilter('#087e8b', '/tmp/caption.txt');
    expect(filter).toContain('scale=1080:1920');
    expect(filter).toContain('fps=30');
    expect(filter).toContain('color=#087e8b@0.92');
    expect(filter).toContain('textfile=/tmp/caption.txt');
  });
});
