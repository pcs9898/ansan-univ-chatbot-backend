import { Body, Controller, Post } from '@nestjs/common';
import { DialogFlowService } from './apis/dialog-flow/dialog-flow.service';
import { LANGUAGE_CODE_ENUM } from './apis/dialog-flow/interfaces/dialog-flow-service.interface';

@Controller()
export class AppController {
  constructor(private readonly dialogFlowService: DialogFlowService) {}

  @Post('/api/askByText')
  async askByText(
    @Body('message') message: string,
    @Body('languageCode') languageCode: LANGUAGE_CODE_ENUM,
  ): Promise<any> {
    return await this.dialogFlowService.detectIntentByText({
      message,
      languageCode,
    });
  }

  @Post('/api/askByEvent')
  async askByEvent(
    @Body('postback') postback: string,
    @Body('languageCode') languageCode: LANGUAGE_CODE_ENUM,
  ): Promise<any> {
    return await this.dialogFlowService.detectIntentByEvent({
      postback,
      languageCode,
    });
  }
}
