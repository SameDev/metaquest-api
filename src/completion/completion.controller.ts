import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { CompletionService } from './completion.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class CompletionController {
  constructor(private completionService: CompletionService) {}

  @Post(':id/complete')
  complete(
    @Request() req: { user: { sub: string } },
    @Param('id') taskId: string,
  ) {
    return this.completionService.completeTask(req.user.sub, taskId);
  }
}
