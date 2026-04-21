import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

const makePrisma = () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
});

const makeJwt = () => ({
  signAsync: jest.fn().mockResolvedValue('mock-token'),
});

const EMAIL = 'user@test.com';
const PASSWORD = 'secret123';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let jwt: ReturnType<typeof makeJwt>;

  beforeEach(() => {
    prisma = makePrisma();
    jwt = makeJwt();
    service = new AuthService(prisma as any, jwt as any);
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('throws ConflictException when email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: EMAIL });

      await expect(service.register({ email: EMAIL, password: PASSWORD }))
        .rejects.toThrow(ConflictException);
    });

    it('hashes the password before saving', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u-1', email: EMAIL });

      await service.register({ email: EMAIL, password: PASSWORD });

      const savedHash = prisma.user.create.mock.calls[0][0].data.password;
      const matches = await bcrypt.compare(PASSWORD, savedHash);
      expect(matches).toBe(true);
    });

    it('never stores plaintext password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u-1', email: EMAIL });

      await service.register({ email: EMAIL, password: PASSWORD });

      const savedPassword = prisma.user.create.mock.calls[0][0].data.password;
      expect(savedPassword).not.toBe(PASSWORD);
    });

    it('returns an access_token on success', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u-1', email: EMAIL });

      const result = await service.register({ email: EMAIL, password: PASSWORD });

      expect(result).toHaveProperty('access_token');
      expect(typeof result.access_token).toBe('string');
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('throws UnauthorizedException when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: EMAIL, password: PASSWORD }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1', email: EMAIL, password: hashed });

      await expect(service.login({ email: EMAIL, password: 'wrong-password' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('returns access_token on valid credentials', async () => {
      const hashed = await bcrypt.hash(PASSWORD, 10);
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1', email: EMAIL, password: hashed });

      const result = await service.login({ email: EMAIL, password: PASSWORD });

      expect(result).toHaveProperty('access_token', 'mock-token');
    });

    it('signs JWT with correct payload (sub + email)', async () => {
      const hashed = await bcrypt.hash(PASSWORD, 10);
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1', email: EMAIL, password: hashed });

      await service.login({ email: EMAIL, password: PASSWORD });

      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: 'u-1', email: EMAIL },
        expect.any(Object),
      );
    });
  });
});
