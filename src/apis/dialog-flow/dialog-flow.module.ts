import { Module } from '@nestjs/common';
import { DialogFlowController } from './dialog-flow.controller';
import { DialogFlowService } from './dialog-flow.service';

@Module({
  imports: [],
  controllers: [DialogFlowController],
  providers: [DialogFlowService],
})
export class DialogFlowModule {}
