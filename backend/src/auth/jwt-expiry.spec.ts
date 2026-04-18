import { jwtExpiryToSeconds } from './jwt-expiry';

describe('jwtExpiryToSeconds', () => {
  it('parses day suffix', () => {
    expect(jwtExpiryToSeconds('7d')).toBe(7 * 86400);
  });

  it('parses hour and minute suffixes', () => {
    expect(jwtExpiryToSeconds('12h')).toBe(12 * 3600);
    expect(jwtExpiryToSeconds('30m')).toBe(30 * 60);
  });

  it('returns numeric string as seconds when unambiguous', () => {
    expect(jwtExpiryToSeconds('604800')).toBe(604800);
  });

  it('falls back to 7 days for invalid input', () => {
    expect(jwtExpiryToSeconds('not-a-duration')).toBe(604800);
  });
});
