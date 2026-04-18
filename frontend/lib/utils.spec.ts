import { cn } from './utils';

describe('cn', () => {
  it('merges multiple class strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('dedupes conflicting tailwind classes via tw-merge (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles object syntax from clsx', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });
});
