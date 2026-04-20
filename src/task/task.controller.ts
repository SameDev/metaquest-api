import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskSchema } from './dto/create-task.dto';
import type { CreateTaskDto } from './dto/create-task.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post()
  create(
    @Request() req: { user: { sub: string } },
    @Body(new ZodValidationPipe(CreateTaskSchema)) dto: CreateTaskDto,
  ) {
    return this.taskService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Request() req: { user: { sub: string } }) {
    return this.taskService.findAll(req.user.sub);
  }
}
