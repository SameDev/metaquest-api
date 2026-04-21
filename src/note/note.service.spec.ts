import { NoteService } from './note.service';

const makePrisma = () => ({
  note: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
});

const USER_ID = 'user-1';

const baseNote = {
  id: 'note-1',
  userId: USER_ID,
  key: '2026-04-20',
  type: 'daily' as const,
  content: '# Nota\n\nConteúdo.',
  updatedAt: new Date(),
};

describe('NoteService', () => {
  let service: NoteService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new NoteService(prisma as any);
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns notes for user ordered by updatedAt desc', async () => {
      prisma.note.findMany.mockResolvedValue([baseNote]);

      const result = await service.findAll(USER_ID);

      expect(prisma.note.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual([baseNote]);
    });

    it('returns empty array when user has no notes', async () => {
      prisma.note.findMany.mockResolvedValue([]);

      const result = await service.findAll(USER_ID);

      expect(result).toEqual([]);
    });
  });

  // ─── upsert ───────────────────────────────────────────────────────────────

  describe('upsert', () => {
    it('upserts note by userId + key composite', async () => {
      const dto = { type: 'daily' as const, key: '2026-04-20', content: '# Hello' };
      prisma.note.upsert.mockResolvedValue(baseNote);

      await service.upsert(USER_ID, dto);

      expect(prisma.note.upsert).toHaveBeenCalledWith({
        where: { userId_key: { userId: USER_ID, key: dto.key } },
        update: { content: dto.content, type: dto.type },
        create: { userId: USER_ID, ...dto },
      });
    });

    it('returns the upserted note', async () => {
      const dto = { type: 'daily' as const, key: '2026-04-20', content: '# Hello' };
      prisma.note.upsert.mockResolvedValue(baseNote);

      const result = await service.upsert(USER_ID, dto);

      expect(result).toEqual(baseNote);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes note by userId + key', async () => {
      prisma.note.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove(USER_ID, '2026-04-20');

      expect(prisma.note.deleteMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, key: '2026-04-20' },
      });
    });
  });
});
