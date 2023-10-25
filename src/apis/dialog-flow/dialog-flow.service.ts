// src/dialogflow/dialogflow.service.ts

import { Injectable } from '@nestjs/common';
import { SessionsClient } from '@google-cloud/dialogflow';
import { ConfigService } from '@nestjs/config';
import {
  IDetectIntentByEvent,
  IDetectIntentByText,
} from './interfaces/dialog-flow-service.interface';

@Injectable()
export class DialogFlowService {
  private readonly sessionsClient: SessionsClient;

  constructor(private configService: ConfigService) {
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
  }: IDetectIntentByText): Promise<any> {
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

    return data;
  }

  async detectIntentByEvent({
    postback,
    languageCode,
  }: IDetectIntentByEvent): Promise<any> {
    const sessionPath = this.sessionsClient.projectAgentSessionPath(
      process.env.GOOGLE_DIALOG_FLOW_PROJECT_ID,
      'sessionId',
    );

    const request = {
      session: sessionPath,
      queryInput: {
        event: {
          // name: postback,
          name: postback,
          languageCode,
          // languageCode,
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

    return data;
  }
}
