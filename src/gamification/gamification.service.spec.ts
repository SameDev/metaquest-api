import { GamificationService } from './gamification.service';

describe('GamificationService', () => {
  let service: GamificationService;

  beforeEach(() => {
    service = new GamificationService();
  });

  // ─── getXPByDifficulty ────────────────────────────────────────────────────

  describe('getXPByDifficulty', () => {
    it('returns 10 for easy', () => {
      expect(service.getXPByDifficulty('easy')).toBe(10);
    });

    it('returns 25 for medium', () => {
      expect(service.getXPByDifficulty('medium')).toBe(25);
    });

    it('returns 50 for hard', () => {
      expect(service.getXPByDifficulty('hard')).toBe(50);
    });
  });

  // ─── calculateLevel ───────────────────────────────────────────────────────

  describe('calculateLevel', () => {
    it('level 1 with 0 XP', () => {
      expect(service.calculateLevel(0)).toBe(1);
    });

    it('still level 1 at 99 XP (threshold is 100)', () => {
      expect(service.calculateLevel(99)).toBe(1);
    });

    it('level 2 at exactly 100 XP', () => {
      expect(service.calculateLevel(100)).toBe(2);
    });

    it('level 2 at 299 XP (needs 100+200=300 for level 3)', () => {
      expect(service.calculateLevel(299)).toBe(2);
    });

    it('level 3 at exactly 300 XP (100+200)', () => {
      expect(service.calculateLevel(300)).toBe(3);
    });

    it('level 4 at exactly 600 XP (100+200+300)', () => {
      expect(service.calculateLevel(600)).toBe(4);
    });

    it('level 5 at exactly 1000 XP (100+200+300+400)', () => {
      expect(service.calculateLevel(1000)).toBe(5);
    });
  });

  // ─── updateStreak ─────────────────────────────────────────────────────────

  describe('updateStreak', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    it('starts streak at 1 when no previous completion', () => {
      expect(service.updateStreak(null, 0)).toBe(1);
    });

    it('keeps streak unchanged when completing on same day', () => {
      expect(service.updateStreak(today, 5)).toBe(5);
    });

    it('increments streak when last completion was yesterday', () => {
      expect(service.updateStreak(yesterday, 7)).toBe(8);
    });

    it('resets streak to 1 when gap is 2+ days', () => {
      expect(service.updateStreak(twoDaysAgo, 15)).toBe(1);
    });

    it('resets streak to 1 when gap is large (30 days)', () => {
      const longAgo = new Date(today);
      longAgo.setDate(longAgo.getDate() - 30);
      expect(service.updateStreak(longAgo, 30)).toBe(1);
    });
  });
});
