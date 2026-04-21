import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TaskModule } from './task/task.module';
import { CompletionModule } from './completion/completion.module';
import { NoteModule } from './note/note.module';
import { IpBlockGuard } from './common/guards/ip-block.guard';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },   // 10 req/s
      { name: 'medium', ttl: 60000, limit: 100 }, // 100 req/min
      { name: 'long', ttl: 3600000, limit: 1000 }, // 1000 req/h
    ]),
    PrismaModule,
    AuthModule,
    UserModule,
    TaskModule,
    CompletionModule,
    NoteModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: IpBlockGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_PIPE, useClass: SanitizePipe },
  ],
})
export class AppModule {}
