import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompletionService } from './completion.service';
import { GamificationService } from '../gamification/gamification.service';

const makePrisma = () => ({
  task: { findFirst: jest.fn() },
  completion: { findFirst: jest.fn(), create: jest.fn() },
  user: { findUnique: jest.fn(), update: jest.fn() },
});

const USER_ID = 'user-1';
const TASK_ID = 'task-1';

const baseTask = {
  id: TASK_ID,
  userId: USER_ID,
  title: 'Task',
  type: 'daily',
  difficulty: 'medium',
  createdAt: new Date(),
};

const baseUser = {
  id: USER_ID,
  email: 'test@test.com',
  xp: 0,
  level: 1,
  streak: 0,
  lastCompletionDate: null,
};

const updatedUser = {
  id: USER_ID,
  email: 'test@test.com',
  level: 1,
  xp: 25,
  streak: 1,
  lastCompletionDate: new Date(),
};

describe('CompletionService', () => {
  let service: CompletionService;
  let prisma: ReturnType<typeof makePrisma>;
  let gamification: GamificationService;

  beforeEach(() => {
    prisma = makePrisma();
    gamification = new GamificationService();
    service = new CompletionService(prisma as any, gamification);
  });

  // ─── completeTask ─────────────────────────────────────────────────────────

  describe('completeTask', () => {
    it('throws NotFoundException when task does not exist or belong to user', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(service.completeTask(USER_ID, TASK_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when task already completed today', async () => {
      prisma.task.findFirst.mockResolvedValue(baseTask);
      prisma.completion.findFirst.mockResolvedValue({ id: 'c-1' });

      await expect(service.completeTask(USER_ID, TASK_ID)).rejects.toThrow(BadRequestException);
    });

    it('creates completion record', async () => {
      prisma.task.findFirst.mockResolvedValue(baseTask);
      prisma.completion.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      await service.completeTask(USER_ID, TASK_ID);

      expect(prisma.completion.create).toHaveBeenCalledWith({
        data: { userId: USER_ID, taskId: TASK_ID },
      });
    });

    it('awards correct XP by difficulty', async () => {
      prisma.task.findFirst.mockResolvedValue(baseTask); // difficulty: medium = 25 XP
      prisma.completion.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.completeTask(USER_ID, TASK_ID);

      expect(result.earnedXp).toBe(25);
    });

    it('updates user with new XP, level and streak', async () => {
      prisma.task.findFirst.mockResolvedValue(baseTask);
      prisma.completion.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      await service.completeTask(USER_ID, TASK_ID);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: expect.objectContaining({
            xp: 25,
            level: 1,
            streak: 1,
          }),
        }),
      );
    });

    it('returns earnedXp and updated user', async () => {
      prisma.task.findFirst.mockResolvedValue(baseTask);
      prisma.completion.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.completeTask(USER_ID, TASK_ID);

      expect(result).toEqual({ earnedXp: 25, user: updatedUser });
    });

    it('levels up user when XP threshold crossed', async () => {
      const nearLevelUser = { ...baseUser, xp: 95 };
      // medium = 25 XP → 120 total → level 2 (needs 100)
      prisma.task.findFirst.mockResolvedValue(baseTask);
      prisma.completion.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(nearLevelUser);
      prisma.user.update.mockResolvedValue({ ...updatedUser, xp: 120, level: 2 });

      await service.completeTask(USER_ID, TASK_ID);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ xp: 120, level: 2 }),
        }),
      );
    });
  });
});
