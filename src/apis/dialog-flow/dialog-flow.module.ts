import { Module } from '@nestjs/common';
import { DialogFlowController } from './dialog-flow.controller';
import { DialogFlowService } from './dialog-flow.service';
import { CrawlingService } from '../crawling/crawling.service';

@Module({
  imports: [],
  controllers: [DialogFlowController],
  providers: [DialogFlowService, CrawlingService],
})
export class DialogFlowModule {}
