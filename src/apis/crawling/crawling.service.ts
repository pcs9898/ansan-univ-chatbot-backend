import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { LANGUAGE_CODE_ENUM } from '../dialog-flow/interfaces/dialog-flow-service.interface';
import { Translate } from '@google-cloud/translate/build/src/v2';

interface ICrawlingServiceCrawlingMeal {
  displayName?: string;
  intentName?: string;
  languageCode: LANGUAGE_CODE_ENUM;
}

const needCrawlingIntent = {
  'faculty-cafeteria': 0,
  'student-cafeteria': 1,
  'dormitory-cafeteria': 2,
};

const needCrawlingIntentDisplayName = {
  '교직원 식당': 0,
  '학생 식당': 1,
  '기숙사 식당': 2,
};

const dayOfWeekEN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const dayOfWeekKO = [
  '일요일',
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
];

const holidayMealTextsMapKO = {
  0: ['◼ 중식 1', '휴무'],
  1: ['◼ 중식 1', '휴무', ' ', '◼ 중식 2', '휴무'],
  2: [
    '◼ 조식',
    '휴무',
    ' ',
    '◼ 중식 1',
    '휴무',
    ' ',
    '◼ 중식 2',
    '휴무',
    ' ',
    '◼ 석식',
    '휴무',
  ],
};

const holidayMealTextsMapEN = {
  0: ['◼ Lunch 1', 'Closed'],
  1: ['◼ Lunch 1', 'Closed', ' ', '◼ Lunch 2', 'Closed'],
  2: [
    '◼ Breakfast',
    'Closed',
    ' ',
    '◼ Lunch 1',
    'Closed',
    ' ',
    '◼ Lunch 2',
    'Closed',
    ' ',
    '◼ Dinner',
    'Closed',
  ],
};

@Injectable()
export class CrawlingService {
  constructor() {}

  async crawlingMeal({
    displayName,
    intentName,
    languageCode,
  }: ICrawlingServiceCrawlingMeal): Promise<any> {
    const translate = new Translate({
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

    let restaurantNumber;

    if (displayName) {
      restaurantNumber = needCrawlingIntentDisplayName[displayName];
    } else {
      restaurantNumber = needCrawlingIntent[intentName];
    }

    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${
      currentDate.getMonth() + 1
    }-${currentDate.getDate()}`;
    const day = currentDate.getDay();
    const date = currentDate.getDate();
    const month = currentDate.getMonth();

    console.log(formattedDate);

    let mealTexts;

    if (languageCode === LANGUAGE_CODE_ENUM.us) {
      mealTexts = [
        '🍴 ' + dayOfWeekEN[day] + ` (${month + 1}.${date})` + ' menu',
        ' ',
      ];
    } else {
      mealTexts = [
        '🍴 ' + dayOfWeekKO[day] + ` (${month + 1}.${date})` + ' 식단',
        ' ',
      ];
    }

    if (day === 0 || day === 6) {
      const selectedHolidayMealTextsMAP =
        languageCode === LANGUAGE_CODE_ENUM.us
          ? holidayMealTextsMapEN[restaurantNumber]
          : holidayMealTextsMapKO[restaurantNumber];

      const holidayMealTexts = [...mealTexts, ...selectedHolidayMealTextsMAP];

      return { texts: holidayMealTexts, buttons: [] };
    }

    const result = [];

    const crawlingPage = async () => {
      let page = 1;
      while (page < 3) {
        const url = `https://www.ansan.ac.kr/www/meals/${restaurantNumber}?PageNo=${page}&RowCnt=10&search1=`;

        const crawlingData = await axios.get(url);
        const $ = cheerio.load(crawlingData.data);

        $('table tbody tr').each((index, element) => {
          const date = $(element).find('th').text().trim();

          if (date === formattedDate) {
            const cafeteria = $(element).find('td:nth-child(2)').text().trim();
            const menuType = $(element).find('td:nth-child(3)').text().trim();
            const price = $(element).find('td:nth-child(4)').text().trim();
            const menu = $(element).find('td:nth-child(5)').text().trim();

            result.push({ date, cafeteria, menuType, price, menu });
          }
        });

        if (restaurantNumber === 0 || restaurantNumber === 1) {
          break;
        }

        page++;
      }
    };

    await crawlingPage();

    result.reverse().map((meal) => {
      if (meal.menuType.includes('[중식]')) {
        meal.menuType = meal.menuType.replace('[중식]', '◼ 중식 ');
        meal.menuType = meal.menuType.replace('일품1', '1');
        meal.menuType = meal.menuType.replace('일품2', '2');
      } else {
        meal.menuType = '◼ ' + meal.menuType;
      }

      const menuItems = meal.menu.split(' ');

      mealTexts.push(meal.menuType, ...menuItems, ' ');
    });

    let translatedMealTexts;

    if (languageCode === LANGUAGE_CODE_ENUM.us) {
      translatedMealTexts = await Promise.all(
        mealTexts.map(async (text) => {
          const [translation] = await translate.translate(text, 'en');
          return translation;
        }),
      );

      return { texts: translatedMealTexts, buttons: [] };
    }

    return { texts: mealTexts, buttons: [] };
  }
}
