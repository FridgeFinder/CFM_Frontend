import { timeAgo } from '../timeAgo';

function ago(seconds: number): Date {
  return new Date(Date.now() - seconds * 1000);
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('timeAgo', () => {
  describe('seconds', () => {
    it('returns "0s ago" for a date of right now', () => {
      expect(timeAgo(ago(0))).toBe('0s ago');
    });

    it('returns "1s ago" for 1 second', () => {
      expect(timeAgo(ago(1))).toBe('1s ago');
    });

    it('returns "45s ago" for 45 seconds', () => {
      expect(timeAgo(ago(45))).toBe('45s ago');
    });

    it('returns "59s ago" for 59 seconds (upper bound)', () => {
      expect(timeAgo(ago(59))).toBe('59s ago');
    });
  });

  describe('minutes', () => {
    it('returns "1m ago" at exactly 60 seconds', () => {
      expect(timeAgo(ago(MINUTE))).toBe('1m ago');
    });

    it('returns "30m ago" for 30 minutes', () => {
      expect(timeAgo(ago(30 * MINUTE))).toBe('30m ago');
    });

    it('returns "59m ago" for 59 minutes 59 seconds (upper bound)', () => {
      expect(timeAgo(ago(59 * MINUTE + 59))).toBe('59m ago');
    });
  });

  describe('hours', () => {
    it('returns "1h ago" at exactly 1 hour', () => {
      expect(timeAgo(ago(HOUR))).toBe('1h ago');
    });

    it('returns "12h ago" for 12 hours', () => {
      expect(timeAgo(ago(12 * HOUR))).toBe('12h ago');
    });

    it('returns "23h ago" for 23 hours 59 minutes (upper bound)', () => {
      expect(timeAgo(ago(23 * HOUR + 59 * MINUTE))).toBe('23h ago');
    });
  });

  describe('days', () => {
    it('returns "1d ago" at exactly 1 day', () => {
      expect(timeAgo(ago(DAY))).toBe('1d ago');
    });

    it('returns "6d ago" for 6 days (upper bound)', () => {
      expect(timeAgo(ago(6 * DAY))).toBe('6d ago');
    });
  });

  describe('weeks', () => {
    it('returns "1w ago" at exactly 7 days', () => {
      expect(timeAgo(ago(7 * DAY))).toBe('1w ago');
    });

    it('returns "4w ago" for 34 days (upper bound)', () => {
      expect(timeAgo(ago(34 * DAY))).toBe('4w ago');
    });
  });

  describe('months', () => {
    it('returns "1mo ago" at 35 days (5 weeks — first month)', () => {
      expect(timeAgo(ago(35 * DAY))).toBe('1mo ago');
    });

    it('returns "6mo ago" for 180 days', () => {
      expect(timeAgo(ago(180 * DAY))).toBe('6mo ago');
    });

    it('returns "11mo ago" for 330 days', () => {
      expect(timeAgo(ago(330 * DAY))).toBe('11mo ago');
    });

    it('returns "12mo ago" for 364 days (upper bound — not "0y ago")', () => {
      expect(timeAgo(ago(364 * DAY))).toBe('12mo ago');
    });
  });

  describe('years', () => {
    it('returns "1y ago" at exactly 365 days', () => {
      expect(timeAgo(ago(365 * DAY))).toBe('1y ago');
    });

    it('returns "2y ago" for 730 days', () => {
      expect(timeAgo(ago(730 * DAY))).toBe('2y ago');
    });

    it('returns "5y ago" for 1825 days', () => {
      expect(timeAgo(ago(1825 * DAY))).toBe('5y ago');
    });
  });
});
