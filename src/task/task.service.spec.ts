import { NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';

const makePrisma = () => ({
  task: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

const USER_ID = 'user-1';
const TASK_ID = 'task-1';

const baseTask = {
  id: TASK_ID,
  userId: USER_ID,
  title: 'Test task',
  type: 'daily' as const,
  difficulty: 'easy' as const,
  createdAt: new Date(),
};

describe('TaskService', () => {
  let service: TaskService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new TaskService(prisma as any);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('calls prisma.task.create with userId merged', async () => {
      const dto = { title: 'My task', type: 'daily' as const, difficulty: 'easy' as const };
      prisma.task.create.mockResolvedValue({ ...baseTask, ...dto });

      await service.create(USER_ID, dto);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: { ...dto, userId: USER_ID },
      });
    });

    it('returns the created task', async () => {
      const dto = { title: 'My task', type: 'weekly' as const, difficulty: 'hard' as const };
      prisma.task.create.mockResolvedValue(baseTask);

      const result = await service.create(USER_ID, dto);

      expect(result).toEqual(baseTask);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns tasks ordered by createdAt desc', async () => {
      const tasks = [baseTask];
      prisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.findAll(USER_ID);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(tasks);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when task does not belong to user', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(service.update(USER_ID, TASK_ID, { title: 'New' }))
        .rejects.toThrow(NotFoundException);
    });

    it('updates and returns task when ownership is valid', async () => {
      prisma.task.findFirst.mockResolvedValue(baseTask);
      const updated = { ...baseTask, title: 'Updated' };
      prisma.task.update.mockResolvedValue(updated);

      const result = await service.update(USER_ID, TASK_ID, { title: 'Updated' });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: TASK_ID },
        data: { title: 'Updated' },
      });
      expect(result).toEqual(updated);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when task does not belong to user', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(service.remove(USER_ID, TASK_ID)).rejects.toThrow(NotFoundException);
    });

    it('deletes task and returns { deleted: true }', async () => {
      prisma.task.findFirst.mockResolvedValue(baseTask);
      prisma.task.delete.mockResolvedValue(baseTask);

      const result = await service.remove(USER_ID, TASK_ID);

      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: TASK_ID } });
      expect(result).toEqual({ deleted: true });
    });
  });
});
