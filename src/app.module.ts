import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { DialogFlowModule } from './apis/dialog-flow/dialog-flow.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    DialogFlowModule,
    RedisModule.forRoot({
      readyLog: true,
      config: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        // password: process.env.REDIS_PASSWD,
      },
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
