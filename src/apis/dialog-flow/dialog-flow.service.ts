// src/dialogflow/dialogflow.service.ts

import { Injectable } from '@nestjs/common';
import { SessionsClient } from '@google-cloud/dialogflow';
import { ConfigService } from '@nestjs/config';
import {
  IDialogFlowServiceDetectIntentByEventName,
  IDialogFlowServiceDetectIntentByText,
} from './interfaces/dialog-flow-service.interface';
import { CrawlingService } from '../crawling/crawling.service';

const needCrawlingIntent = [
  'student-cafeteria',
  'faculty-cafeteria',
  'dormitory-cafeteria',
];

const needCrawlingIntentDisplayName = [
  '학생 식당',
  '기숙사 식당',
  '교직원 식당',
];

@Injectable()
export class DialogFlowService {
  private readonly sessionsClient: SessionsClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly crawlingService: CrawlingService,
  ) {
    this.sessionsClient = new SessionsClient({
      projectId: process.env.GOOGLE_DIALOG_FLOW_PROJECT_ID,
      credentials: {
        private_key: process.env.GOOGLE_DIALOG_FLOW_PRIVATE_KEY.replace(
          /\\n/g,
          '\n',
        ),
        client_email: process.env.GOOGLE_DIALOG_FLOW_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_DIALOG_FLOW_CLIENT_ID,
      },
    });
  }

  async detectIntentByText({
    message,
    languageCode,
  }: IDialogFlowServiceDetectIntentByText): Promise<any> {
    const sessionPath = this.sessionsClient.projectAgentSessionPath(
      process.env.GOOGLE_DIALOG_FLOW_PROJECT_ID,
      'sessionId',
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode,
        },
      },
    };

    const responses = await this.sessionsClient.detectIntent(request);

    if (responses[0].queryResult.fulfillmentText === 'fail') {
      return 'fail';
    } else if (responses[0].queryResult.fulfillmentText === 'greeting') {
      return 'greeting';
    }

    const response = responses[0];

    const displayName = response.queryResult.intent.displayName;
    let mealTexts;

    if (needCrawlingIntentDisplayName.includes(displayName)) {
      mealTexts = await this.crawlingService.crawlingMeal({
        displayName,
        languageCode,
      });
    }

    let data;

    if (
      response &&
      response.queryResult &&
      response.queryResult.fulfillmentMessages &&
      response.queryResult.fulfillmentMessages.length > 0
    ) {
      const payload = response.queryResult.fulfillmentMessages[0].payload;

      if (
        payload &&
        payload.fields &&
        payload.fields.cardList &&
        payload.fields.cardList.listValue &&
        payload.fields.cardList.listValue.values
      ) {
        const cardListValues = payload.fields.cardList.listValue.values;

        const cardList = cardListValues.map((item) => {
          const structValue = item.structValue;

          const texts =
            structValue.fields.texts?.listValue?.values
              ?.map((val) => val.stringValue)
              .filter(Boolean) ?? [];

          const buttons =
            structValue.fields.buttons?.listValue?.values?.map((val) => {
              const buttonText = val.structValue.fields.buttonText?.stringValue;
              const link = val.structValue.fields.link?.stringValue;
              const postBack = val.structValue.fields.postBack?.stringValue;
              return { buttonText, link, postBack };
            }) ?? [];

          return { texts, buttons };
        });

        data = { cardList };
      }
    }

    if (mealTexts) {
      data.cardList.push(mealTexts);
    }

    return data;
  }

  async detectIntentByEvent({
    postback,
    languageCode,
  }: IDialogFlowServiceDetectIntentByEventName): Promise<any> {
    const sessionPath = this.sessionsClient.projectAgentSessionPath(
      process.env.GOOGLE_DIALOG_FLOW_PROJECT_ID,
      'sessionId',
    );

    let mealTexts;

    if (needCrawlingIntent.includes(postback)) {
      mealTexts = await this.crawlingService.crawlingMeal({
        intentName: postback,
        languageCode,
      });
    }

    const request = {
      session: sessionPath,
      queryInput: {
        event: {
          name: postback,
          languageCode,
        },
      },
    };

    const responses = await this.sessionsClient.detectIntent(request);

    if (responses[0].queryResult.fulfillmentText === 'fail') {
      return 'fail';
    }
    const response = responses[0];

    let data;

    if (
      response &&
      response.queryResult &&
      response.queryResult.fulfillmentMessages &&
      response.queryResult.fulfillmentMessages.length > 0
    ) {
      const payload = response.queryResult.fulfillmentMessages[0].payload;

      if (
        payload &&
        payload.fields &&
        payload.fields.cardList &&
        payload.fields.cardList.listValue &&
        payload.fields.cardList.listValue.values
      ) {
        const cardListValues = payload.fields.cardList.listValue.values;

        const cardList = cardListValues.map((item) => {
          const structValue = item.structValue;

          const texts =
            structValue.fields.texts?.listValue?.values
              ?.map((val) => val.stringValue)
              .filter(Boolean) ?? [];

          const buttons =
            structValue.fields.buttons?.listValue?.values?.map((val) => {
              const buttonText = val.structValue.fields.buttonText?.stringValue;
              const link = val.structValue.fields.link?.stringValue;
              const postBack = val.structValue.fields.postBack?.stringValue;
              return { buttonText, link, postBack };
            }) ?? [];

          return { texts, buttons };
        });

        data = { cardList };
      }
    }

    if (mealTexts) {
      data.cardList.push(mealTexts);
    }

    return data;
  }
}
