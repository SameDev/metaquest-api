import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class CompletionService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async completeTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) throw new NotFoundException('Task not found');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const alreadyCompleted = await this.prisma.completion.findFirst({
      where: { taskId, userId, completedAt: { gte: todayStart } },
    });
    if (alreadyCompleted) throw new BadRequestException('Task already completed today');

    await this.prisma.completion.create({ data: { userId, taskId } });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const earnedXp = this.gamification.getXPByDifficulty(task.difficulty);
    const newXp = user!.xp + earnedXp;
    const newLevel = this.gamification.calculateLevel(newXp);
    const newStreak = this.gamification.updateStreak(user!.lastCompletionDate, user!.streak);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastCompletionDate: new Date(),
      },
      select: { id: true, email: true, level: true, xp: true, streak: true, lastCompletionDate: true },
    });

    return { earnedXp, user: updated };
  }
}
