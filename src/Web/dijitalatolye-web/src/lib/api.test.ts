import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './api';

describe('getApiErrorMessage', () => {
  it('returns detail from problem response', () => {
    const msg = getApiErrorMessage({
      response: { data: { detail: 'E-posta zaten kayıtlı' } },
    });
    expect(msg).toBe('E-posta zaten kayıtlı');
  });

  it('falls back to generic message', () => {
    expect(getApiErrorMessage({})).toBeTruthy();
  });
});
