import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import type { UpdateUserDto } from './dto/update-user.dto';

const SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  level: true,
  xp: true,
  streak: true,
  lastCompletionDate: true,
  createdAt: true,
};

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  getMe(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId }, select: SELECT });
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (dto.newPassword) {
      const valid = await bcrypt.compare(dto.currentPassword!, user!.password);
      if (!valid) throw new UnauthorizedException('Senha atual incorreta');
    }

    if (dto.email && dto.email !== user!.email) {
      const taken = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (taken) throw new ConflictException('Email já está em uso');
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.newPassword) data.password = await bcrypt.hash(dto.newPassword, 10);

    return this.prisma.user.update({ where: { id: userId }, data, select: SELECT });
  }
}
