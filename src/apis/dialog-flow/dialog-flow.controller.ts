import { Body, Controller, Post } from '@nestjs/common';
import { DialogFlowService } from './dialog-flow.service';
import { LANGUAGE_CODE_ENUM } from './interfaces/dialog-flow-service.interface';

@Controller()
export class DialogFlowController {
  constructor(private readonly dialogFlowService: DialogFlowService) {}

  @Post('/api/askByText')
  async askByText(
    @Body('message') message: string,
    @Body('languageCode') languageCode: LANGUAGE_CODE_ENUM,
  ): Promise<any> {
    const result = await this.dialogFlowService.detectIntentByText({
      message,
      languageCode,
    });

    return result;
  }

  @Post('/api/askByEvent')
  async askByEvent(
    @Body('postback') postback: string,
    @Body('languageCode') languageCode: LANGUAGE_CODE_ENUM,
  ): Promise<any> {
    const result = await this.dialogFlowService.detectIntentByEvent({
      postback,
      languageCode,
    });

    return result;
  }
}
