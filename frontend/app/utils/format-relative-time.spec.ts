import { formatRelativeTime } from './format-relative-time';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-18T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns em-dash for missing input', () => {
    expect(formatRelativeTime()).toBe('—');
  });

  it('returns em-dash for unparseable input', () => {
    expect(formatRelativeTime('not a date')).toBe('—');
  });

  it('formats seconds when under a minute', () => {
    expect(formatRelativeTime('2026-04-18T11:59:30Z')).toBe('30s ago');
  });

  it('formats minutes when under an hour', () => {
    expect(formatRelativeTime('2026-04-18T11:30:00Z')).toBe('30m ago');
  });

  it('formats hours when under a day', () => {
    expect(formatRelativeTime('2026-04-18T06:00:00Z')).toBe('6h ago');
  });

  it('formats days when older', () => {
    expect(formatRelativeTime('2026-04-15T12:00:00Z')).toBe('3d ago');
  });

  it('clamps future dates to 0s ago', () => {
    expect(formatRelativeTime('2026-04-18T13:00:00Z')).toBe('0s ago');
  });
});
