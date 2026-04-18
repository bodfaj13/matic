import {
  formatTicketPriority,
  isTicketPriority,
  TICKET_PRIORITY_ORDER,
  TicketPriority,
  ticketPriorityLabel,
} from './ticket-priority';

describe('ticket-priority enums', () => {
  describe('isTicketPriority', () => {
    it.each(Object.values(TicketPriority))(
      'returns true for valid value %s',
      (value) => {
        expect(isTicketPriority(value)).toBe(true);
      },
    );

    it('returns false for an unknown value', () => {
      expect(isTicketPriority('urgent')).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(isTicketPriority('HIGH')).toBe(false);
    });
  });

  describe('formatTicketPriority', () => {
    it('maps every enum value to its label', () => {
      for (const priority of TICKET_PRIORITY_ORDER) {
        expect(formatTicketPriority(priority)).toBe(
          ticketPriorityLabel[priority],
        );
      }
    });
  });
});
