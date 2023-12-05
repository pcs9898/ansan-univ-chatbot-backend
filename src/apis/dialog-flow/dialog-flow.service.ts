// src/dialogflow/dialogflow.service.ts

import { Injectable } from '@nestjs/common';
import { SessionsClient } from '@google-cloud/dialogflow';
import {
  IDialogFlowServiceDetectIntentByEventName,
  IDialogFlowServiceDetectIntentByText,
} from './interfaces/dialog-flow-service.interface';
import { CrawlingService } from '../crawling/crawling.service';
import { Redis } from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import * as moment from 'moment-timezone';

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
    private readonly crawlingService: CrawlingService,
    @InjectRedis() private readonly redisClient: Redis,
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

  getSecondsUntilMidnight() {
    const now = moment().tz('Asia/Seoul');
    const midnight = now.clone().add(1, 'day').startOf('day');

    return midnight.diff(now, 'seconds');
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

    let cachedMealTexts;

    if (needCrawlingIntentDisplayName.includes(displayName)) {
      cachedMealTexts = await this.redisClient.get(
        displayName.concat(' ' + languageCode),
      );

      if (cachedMealTexts) {
        mealTexts = JSON.parse(cachedMealTexts);
      } else {
        mealTexts = await this.crawlingService.crawlingMeal({
          displayName,
          languageCode,
        });
      }
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
      if (!cachedMealTexts) {
        await this.redisClient.set(
          displayName.concat(' ' + languageCode),
          JSON.stringify(mealTexts),
          'EX',
          this.getSecondsUntilMidnight(),
        );
      }
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
    const result = await this.redisClient.get(
      postback.concat(' ' + languageCode),
    );

    if (result) {
      return JSON.parse(result);
    }

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
      await this.redisClient.set(
        postback.concat(' ' + languageCode),
        JSON.stringify(data),
        'EX',
        this.getSecondsUntilMidnight(),
      );
    } else {
      await this.redisClient.set(
        postback.concat(' ' + languageCode),
        JSON.stringify(data),
      );
    }

    return data;
  }
}
