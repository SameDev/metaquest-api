import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TaskService, JwtAuthGuard],
  controllers: [TaskController],
})
export class TaskModule {}
