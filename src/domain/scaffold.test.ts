import { describe, it, expect } from 'vitest';

// Smoke test to confirm the Vitest + fast-check toolchain is wired up.
describe('scaffold toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
