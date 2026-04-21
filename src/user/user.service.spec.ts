import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';

const makePrisma = () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
});

const USER_ID = 'user-1';
const EMAIL = 'user@test.com';
const PASSWORD_HASH = bcrypt.hashSync('secret123', 10);

const baseUser = {
  id: USER_ID,
  email: EMAIL,
  password: PASSWORD_HASH,
  name: null,
  avatarUrl: null,
  level: 1,
  xp: 0,
  streak: 0,
  lastCompletionDate: null,
  createdAt: new Date(),
};

describe('UserService', () => {
  let service: UserService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new UserService(prisma as any);
  });

  // ─── getMe ────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('returns user without password', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await service.getMe(USER_ID);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: USER_ID } }),
      );
    });
  });

  // ─── updateMe ─────────────────────────────────────────────────────────────

  describe('updateMe', () => {
    it('updates name without requiring password', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({ ...baseUser, name: 'Samuel' });

      await service.updateMe(USER_ID, { name: 'Samuel' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: 'Samuel' } }),
      );
    });

    it('throws UnauthorizedException when currentPassword is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.updateMe(USER_ID, { currentPassword: 'wrong', newPassword: 'newpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('hashes new password when currentPassword is correct', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(baseUser);

      await service.updateMe(USER_ID, {
        currentPassword: 'secret123',
        newPassword: 'newpassword',
      });

      const savedHash = prisma.user.update.mock.calls[0][0].data.password;
      const matches = await bcrypt.compare('newpassword', savedHash);
      expect(matches).toBe(true);
    });

    it('throws ConflictException when new email is taken', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(baseUser)               // current user
        .mockResolvedValueOnce({ id: 'other-user' });  // email taken

      await expect(
        service.updateMe(USER_ID, { email: 'taken@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('allows email update when email is not taken', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(baseUser)
        .mockResolvedValueOnce(null); // email free
      prisma.user.update.mockResolvedValue({ ...baseUser, email: 'new@test.com' });

      await service.updateMe(USER_ID, { email: 'new@test.com' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { email: 'new@test.com' } }),
      );
    });

    it('updates avatarUrl', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(baseUser);
      const url = 'https://example.com/avatar.jpg';

      await service.updateMe(USER_ID, { avatarUrl: url });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { avatarUrl: url } }),
      );
    });

    it('does not include undefined fields in update data', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(baseUser);

      await service.updateMe(USER_ID, { name: 'Samuel' });

      const data = prisma.user.update.mock.calls[0][0].data;
      expect(data).not.toHaveProperty('email');
      expect(data).not.toHaveProperty('avatarUrl');
      expect(data).not.toHaveProperty('password');
    });
  });
});
