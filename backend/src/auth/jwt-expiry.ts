/** Parse values like 1d, 7d, 12h, 30m into seconds for jsonwebtoken. */
export function jwtExpiryToSeconds(value: string): number {
  const trimmed = value.trim();
  const asNum = Number(trimmed);
  if (!Number.isNaN(asNum) && trimmed === String(asNum)) {
    return asNum;
  }
  const m = /^(\d+)([dhms])$/i.exec(trimmed);
  if (!m) {
    return 604800;
  }
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  const mult = u === 'd' ? 86400 : u === 'h' ? 3600 : u === 'm' ? 60 : 1;
  return n * mult;
}
