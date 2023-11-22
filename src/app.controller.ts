import { Controller, Post } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}
  @Post('/')
  async askByText(): Promise<any> {
    return 'OK';
  }
}
