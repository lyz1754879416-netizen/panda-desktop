import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from './settings';

describe('settings store', () => {
  beforeEach(() => useSettings.setState({ volume: 35, muted: false }));

  it('defaults to audible volume 35', () => {
    expect(useSettings.getState().volume).toBe(35);
    expect(useSettings.getState().muted).toBe(false);
  });

  it('clamps volume to the supported range', () => {
    useSettings.getState().setVolume(120);
    expect(useSettings.getState().volume).toBe(100);
    useSettings.getState().setVolume(-10);
    expect(useSettings.getState().volume).toBe(0);
  });
});
