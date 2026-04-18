import {
  formatTicketStatus,
  isTicketStatus,
  TICKET_STATUS_ORDER,
  TicketStatus,
  ticketStatusLabel,
} from './ticket-status';

describe('ticket-status enums', () => {
  describe('isTicketStatus', () => {
    it.each(Object.values(TicketStatus))(
      'returns true for valid value %s',
      (value) => {
        expect(isTicketStatus(value)).toBe(true);
      },
    );

    it('returns false for an unknown value', () => {
      expect(isTicketStatus('archived')).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(isTicketStatus('OPEN')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isTicketStatus('')).toBe(false);
    });
  });

  describe('formatTicketStatus', () => {
    it('maps every enum value to its label without throwing', () => {
      for (const status of TICKET_STATUS_ORDER) {
        expect(formatTicketStatus(status)).toBe(ticketStatusLabel[status]);
      }
    });

    it("formats InProgress as 'In progress' (non-trivial casing)", () => {
      expect(formatTicketStatus(TicketStatus.InProgress)).toBe('In progress');
    });
  });
});
