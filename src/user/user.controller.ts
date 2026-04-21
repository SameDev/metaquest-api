import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateUserSchema } from './dto/update-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@Request() req: { user: { sub: string } }) {
    return this.userService.getMe(req.user.sub);
  }

  @Patch('me')
  updateMe(
    @Request() req: { user: { sub: string } },
    @Body(new ZodValidationPipe(UpdateUserSchema)) dto: UpdateUserDto,
  ) {
    return this.userService.updateMe(req.user.sub, dto);
  }
}
