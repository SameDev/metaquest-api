import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: { ...dto, userId },
    });
  }

  async findAll(userId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const tasks = await this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        completions: {
          where: { userId },
          select: { completedAt: true },
        },
      },
    });

    return tasks.map(({ completions, ...rest }) => ({
      ...rest,
      completed_today: completions.some((c) => c.completedAt >= startOfDay),
      month_completions: completions.filter((c) => c.completedAt >= startOfMonth).length,
    }));
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.task.update({
      where: { id: taskId },
      data: dto,
    });
  }

  async remove(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
      include: { _count: { select: { completions: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const completionCount = task._count.completions;
    if (completionCount > 0) {
      const xpToRemove = this.gamification.getXPByDifficulty(task.difficulty) * completionCount;
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
      const newXp = Math.max(0, (user?.xp ?? 0) - xpToRemove);
      await this.prisma.user.update({
        where: { id: userId },
        data: { xp: newXp, level: this.gamification.calculateLevel(newXp) },
      });
    }

    await this.prisma.task.delete({ where: { id: taskId } });
    return { deleted: true };
  }
}
