export enum LANGUAGE_CODE_ENUM {
  ko = 'ko-KO',
  us = 'en-US',
}

export interface IDetectIntentByText {
  message: string;
  languageCode: LANGUAGE_CODE_ENUM;
}

export interface IDetectIntentByEvent {
  postback: string;
  languageCode: LANGUAGE_CODE_ENUM;
}
