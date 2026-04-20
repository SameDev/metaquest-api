import { Module } from '@nestjs/common';
import { CompletionService } from './completion.service';
import { CompletionController } from './completion.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, GamificationModule],
  providers: [CompletionService, JwtAuthGuard],
  controllers: [CompletionController],
})
export class CompletionModule {}
