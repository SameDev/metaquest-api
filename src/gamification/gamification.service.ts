import { Injectable } from '@nestjs/common';
import { Difficulty } from '@prisma/client';

@Injectable()
export class GamificationService {
  getXPByDifficulty(difficulty: Difficulty): number {
    const map: Record<Difficulty, number> = {
      easy: 10,
      medium: 25,
      hard: 50,
    };
    return map[difficulty];
  }

  calculateLevel(xp: number): number {
    let level = 1;
    let xpRequired = level * 100;
    while (xp >= xpRequired) {
      xp -= xpRequired;
      level++;
      xpRequired = level * 100;
    }
    return level;
  }

  updateStreak(lastCompletionDate: Date | null, currentStreak: number): number {
    if (!lastCompletionDate) return 1;

    const today = new Date();
    const last = new Date(lastCompletionDate);

    today.setHours(0, 0, 0, 0);
    last.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return currentStreak;
    if (diffDays === 1) return currentStreak + 1;
    return 1;
  }
}
