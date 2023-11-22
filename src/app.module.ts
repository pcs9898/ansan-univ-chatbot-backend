import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { DialogFlowModule } from './apis/dialog-flow/dialog-flow.module';

@Module({
  imports: [
    DialogFlowModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
