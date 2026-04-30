import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import Setup from './Setup.svelte';
import { ritual } from '$lib/stores/ritual';
import { DEFAULT_RITUAL } from '$lib/utils/types';

describe('Setup', () => {
  beforeEach(() => {
    ritual.set({ ...DEFAULT_RITUAL });
  });

  afterEach(() => {
    cleanup();
  });

  it('disables submit when date and location empty', () => {
    const { getByRole } = render(Setup);
    const button = getByRole('button', { name: /進入儀式/ });
    expect(button).toBeDisabled();
  });

  it('enables submit when date and location filled', async () => {
    const { getByLabelText, getByRole } = render(Setup);
    await fireEvent.input(getByLabelText('日期'), { target: { value: '2026-05-15' } });
    await fireEvent.input(getByLabelText('地點'), { target: { value: '玉山' } });
    const button = getByRole('button', { name: /進入儀式/ });
    expect(button).not.toBeDisabled();
  });
});
