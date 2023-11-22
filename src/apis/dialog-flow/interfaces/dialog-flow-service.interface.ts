export enum LANGUAGE_CODE_ENUM {
  ko = 'ko-KO',
  us = 'en-US',
}

export interface IDialogFlowServiceDetectIntentByText {
  message: string;
  languageCode: LANGUAGE_CODE_ENUM;
}

export interface IDialogFlowServiceDetectIntentByEventName {
  postback: string;
  languageCode: LANGUAGE_CODE_ENUM;
}
