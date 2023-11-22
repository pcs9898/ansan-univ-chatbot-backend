import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { LANGUAGE_CODE_ENUM } from '../dialog-flow/interfaces/dialog-flow-service.interface';

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

const dayOfWeekEn = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const dayOfWeekKo = [
  '일요일',
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
];

@Injectable()
export class CrawlingService {
  constructor() {}

  async crawlingMeal({
    displayName,
    intentName,
    languageCode,
  }: ICrawlingServiceCrawlingMeal): Promise<any> {
    let crawlingData;

    if (displayName) {
      crawlingData = await axios.get(
        `https://www.ansan.ac.kr/www/meals/${needCrawlingIntentDisplayName[displayName]}`,
      );
    } else {
      crawlingData = await axios.get(
        `https://www.ansan.ac.kr/www/meals/${needCrawlingIntent[intentName]}`,
      );
    }

    const $ = cheerio.load(crawlingData.data);

    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${
      currentDate.getMonth() + 1
    }-${currentDate.getDate()}`;
    const day = currentDate.getDay();
    const date = currentDate.getDate();
    const month = currentDate.getMonth();
    if (day === 0 || day === 6) {
      return;
    }

    const result = [];

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

    let mealTexts;

    if (languageCode === LANGUAGE_CODE_ENUM.us) {
      mealTexts = [
        '🍴 ' + dayOfWeekEn[day] + ` (${month}.${date})` + ' menu',
        ' ',
      ];
    } else {
      mealTexts = [
        '🍴 ' + dayOfWeekKo[day] + ` (${month}.${date})` + ' 식단',
        ' ',
      ];
    }

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

    return { texts: mealTexts, buttons: [] };
  }
}
