import { ticketDisplayRef, ticketDisplayRefHash } from './ticket-ref';

describe('ticketDisplayRef', () => {
  it('uses the last 4 chars of the id, uppercased, with TRG- prefix', () => {
    expect(ticketDisplayRef('507f1f77bcf86cd799439011')).toBe('TRG-9011');
  });

  it('uppercases hex digits', () => {
    expect(ticketDisplayRef('abc123def456')).toBe('TRG-F456');
  });

  it('ticketDisplayRefHash adds a leading #', () => {
    expect(ticketDisplayRefHash('507f1f77bcf86cd799439011')).toBe('#TRG-9011');
  });
});
