import { describe, expect, it, beforeEach } from 'vitest';
import { useAuthStore } from './auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('stores tokens and clears on logout', () => {
    useAuthStore.getState().setTokens('access', 'refresh');
    useAuthStore.getState().setUser('teacher@meb.k12.tr', ['Teacher']);
    expect(useAuthStore.getState().accessToken).toBe('access');
    expect(useAuthStore.getState().roles).toContain('Teacher');

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().email).toBeNull();
  });
});
