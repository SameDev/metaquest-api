import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailService } from './email.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthService, EmailService],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
