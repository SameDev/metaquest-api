import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: { ...dto, userId },
    });
  }

  findAll(userId: string) {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
