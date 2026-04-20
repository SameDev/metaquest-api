import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskSchema } from './dto/create-task.dto';
import type { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskSchema } from './dto/update-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
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

  @Patch(':id')
  update(
    @Request() req: { user: { sub: string } },
    @Param('id') taskId: string,
    @Body(new ZodValidationPipe(UpdateTaskSchema)) dto: UpdateTaskDto,
  ) {
    return this.taskService.update(req.user.sub, taskId, dto);
  }

  @Delete(':id')
  remove(
    @Request() req: { user: { sub: string } },
    @Param('id') taskId: string,
  ) {
    return this.taskService.remove(req.user.sub, taskId);
  }
}
