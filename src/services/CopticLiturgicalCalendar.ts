import { CopticCalendarDate } from '@/types';

export class CopticLiturgicalCalendar {
  private static instance: CopticLiturgicalCalendar;

  private readonly copticMonths = [
    'Thout', 'Paope', 'Hathor', 'Koiahk', 'Tobe', 'Meshir',
    'Paremhotep', 'Parmoute', 'Pashons', 'Paone', 'Epep', 'Mesore', 'Pi Kogi Enavot'
  ];

  private readonly copticSeasons = {
    'Annual': 'Annual Period',
    'Nativity': 'Nativity Fast',
    'Theophany': 'Theophany Season',
    'GreatFast': 'Great Fast',
    'HolyWeek': 'Holy Week',
    'Resurrection': 'Resurrection Period',
    'Ascension': 'Ascension Season',
    'Pentecost': 'Pentecost Season',
    'ApostlesFast': 'Apostles Fast',
    'StMaryFast': 'St. Mary\'s Fast',
    'CrossFeast': 'Feast of the Cross'
  };

  private constructor() {}

  public static getInstance(): CopticLiturgicalCalendar {
    if (!CopticLiturgicalCalendar.instance) {
      CopticLiturgicalCalendar.instance = new CopticLiturgicalCalendar();
    }
    return CopticLiturgicalCalendar.instance;
  }

  /**
   * Convert Gregorian date to Coptic calendar date
   */
  public gregorianToCoptic(gregorianDate: Date): CopticCalendarDate {
    // Coptic calendar starts on August 29, 284 AD (Gregorian)
    const copticEpoch = new Date(284, 7, 29); // Month is 0-indexed in JS
    const timeDiff = gregorianDate.getTime() - copticEpoch.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    // Coptic year is 365.25 days on average
    const copticYear = Math.floor(daysDiff / 365.25) + 1;
    const remainingDays = daysDiff - Math.floor((copticYear - 1) * 365.25);

    // Each Coptic month has 30 days, except the 13th month (Pi Kogi Enavot) which has 5 or 6 days
    let copticMonth = 1;
    let copticDay = remainingDays + 1;

    while (copticDay > 30 && copticMonth < 13) {
      copticDay -= 30;
      copticMonth++;
    }

    // Handle the 13th month (Pi Kogi Enavot)
    if (copticMonth === 13) {
      const isLeapYear = copticYear % 4 === 3; // Coptic leap year rule
      const daysInPiKogi = isLeapYear ? 6 : 5;
      if (copticDay > daysInPiKogi) {
        copticDay = 1;
        copticMonth = 1;
      }
    }

    return {
      copticDay,
      copticMonth: this.copticMonths[copticMonth - 1],
      copticYear,
      gregorianDate
    };
  }

  /**
   * Format Coptic date as readable string
   */
  public formatCopticDate(gregorianDate: Date): string {
    const copticDate = this.gregorianToCoptic(gregorianDate);
    const ordinalDay = this.getOrdinalNumber(copticDate.copticDay);
    return `${ordinalDay} ${copticDate.copticMonth}, ${copticDate.copticYear}`;
  }

  /**
   * Get the current liturgical season
   */
  public getCurrentSeason(date: Date): string {
    const month = date.getMonth() + 1; // JS months are 0-indexed
    const day = date.getDate();
    const year = date.getFullYear();

    // Calculate Easter date for the year (Orthodox Easter)
    const easter = this.calculateOrthodoxEaster(year);
    const easterMonth = easter.getMonth() + 1;
    const easterDay = easter.getDate();

    // Great Fast (starts 48 days before Easter)
    const greatFastStart = new Date(easter);
    greatFastStart.setDate(easter.getDate() - 48);
    
    // Holy Week (7 days before Easter)
    const holyWeekStart = new Date(easter);
    holyWeekStart.setDate(easter.getDate() - 7);

    // Resurrection Period (50 days after Easter until Pentecost)
    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 50);

    // Apostles Fast (starts 8 days after Pentecost, ends June 29)
    const apostlesFastStart = new Date(pentecost);
    apostlesFastStart.setDate(pentecost.getDate() + 8);
    const apostlesFastEnd = new Date(year, 5, 29); // June 29

    // St. Mary's Fast (August 7-21)
    const stMaryStart = new Date(year, 7, 7);  // August 7
    const stMaryEnd = new Date(year, 7, 21);   // August 21

    // Nativity Fast (November 25 - January 6)
    const nativityStart = new Date(year, 10, 25); // November 25
    const nativityEnd = new Date(year + 1, 0, 6); // January 6 of next year

    const currentDate = new Date(year, month - 1, day);

    // Check seasons in chronological order
    if (this.isDateInRange(currentDate, nativityStart, nativityEnd) || 
        (month === 1 && day <= 6)) { // Handle January dates for Nativity
      return this.copticSeasons.Nativity;
    }

    if (month === 1 && day >= 7 && day <= 19) {
      return this.copticSeasons.Theophany;
    }

    if (this.isDateInRange(currentDate, greatFastStart, holyWeekStart)) {
      return this.copticSeasons.GreatFast;
    }

    if (this.isDateInRange(currentDate, holyWeekStart, easter)) {
      return this.copticSeasons.HolyWeek;
    }

    if (this.isDateInRange(currentDate, easter, pentecost)) {
      return this.copticSeasons.Resurrection;
    }

    if (this.isDateInRange(currentDate, apostlesFastStart, apostlesFastEnd)) {
      return this.copticSeasons.ApostlesFast;
    }

    if (this.isDateInRange(currentDate, stMaryStart, stMaryEnd)) {
      return this.copticSeasons.StMaryFast;
    }

    // Feast of the Cross (September 17)
    if (month === 9 && day === 17) {
      return this.copticSeasons.CrossFeast;
    }

    return this.copticSeasons.Annual;
  }

  /**
   * Evaluate season condition for XML parsing
   */
  public evaluateSeasonCondition(condition: string, documentContexts: { [key: string]: boolean } = {}, date?: Date): boolean {
    const currentDate = date || new Date();
    const currentSeason = this.getCurrentSeason(currentDate);

    console.log('DEBUG: evaluateSeasonCondition - condition:', condition);
    console.log('DEBUG: evaluateSeasonCondition - currentSeason:', currentSeason);
    console.log('DEBUG: evaluateSeasonCondition - documentContexts:', documentContexts);

    // IMPORTANT: Check for OR operator FIRST before checking for date-based conditions
    // This allows us to handle conditions like "Thoout.21 | Thoout.23" correctly
    if (condition.includes('|')) {
      const seasons = condition.split('|').map(s => s.trim());
      // Recursively evaluate each season condition to handle date-based conditions
      const result = seasons.some(season => this.evaluateSeasonCondition(season, documentContexts, date));
      console.log('DEBUG: OR condition evaluated to:', result);
      return result;
    }

    // Check if this is a date-based condition (e.g., "Thoout.1" for Synaxarion)
    // Format: [MonthName].[DayNumber]
    if (condition.includes('.')) {
      const [monthName, dayStr] = condition.split('.');
      const dayNumber = parseInt(dayStr, 10);

      if (!isNaN(dayNumber)) {
        // Get current Coptic date
        const copticDate = this.gregorianToCoptic(currentDate);

        // Compare with the condition
        const matches = copticDate.copticMonth === monthName && copticDate.copticDay === dayNumber;
        console.log('DEBUG: Date-based condition - copticMonth:', copticDate.copticMonth, 'copticDay:', copticDate.copticDay, 'matches:', matches);
        return matches;
      }
    }

    // Special case: "Other" means "not any of the special seasons above"
    // In practice, this should match during regular fasting days and standard days
    if (condition === 'Other') {
      // "Other" should match when we're not in any of the joyful/special periods
      // For simplicity, we'll say it matches during fasting periods and regular days
      const result = currentSeason.includes('Nativity') ||
                     currentSeason.includes('GreatFast') ||
                     currentSeason.includes('ApostlesFast') ||
                     currentSeason.includes('StMaryFast') ||
                     currentSeason === 'Other';
      console.log('DEBUG: "Other" condition evaluated to:', result);
      return result;
    }

    // Handle complex conditions like "!GreatFast" or "!Agpeya" or "Nativity|Theophany"
    if (condition.startsWith('!')) {
      // Check if this is a compound condition with ^ (AND operator)
      if (condition.includes('^')) {
        // Split by ^ and evaluate each part
        const parts = condition.split('^').map(p => p.trim());
        const results: boolean[] = [];

        for (const part of parts) {
          if (part.startsWith('!')) {
            const excludedContext = part.substring(1).trim();

            // Check if this is a document context condition
            if (documentContexts[excludedContext] !== undefined) {
              const partResult = !documentContexts[excludedContext];
              results.push(partResult);
              console.log('DEBUG: Compound part (!', excludedContext, '), context is', documentContexts[excludedContext], ', evaluated to:', partResult);
            } else {
              // Liturgical season negation
              const partResult = !currentSeason.includes(excludedContext);
              results.push(partResult);
              console.log('DEBUG: Compound liturgical part (!', excludedContext, ') evaluated to:', partResult);
            }
          } else {
            // Positive condition in compound (unusual but possible)
            results.push(currentSeason.includes(part));
          }
        }

        // All parts must be true for AND condition
        const finalResult = results.every(r => r);
        console.log('DEBUG: Compound negation condition evaluated to:', finalResult);
        return finalResult;
      }

      // Simple negation (single !)
      const excludedContext = condition.substring(1).trim();

      // First, check if this is a document context condition (e.g., !Agpeya, !Liturgy)
      // These are not liturgical seasons but document types
      if (documentContexts[excludedContext] !== undefined) {
        // If we're IN the excluded context, return FALSE (filter out this content)
        const result = !documentContexts[excludedContext];
        console.log('DEBUG: Document context negation condition (!', excludedContext, '), context is', documentContexts[excludedContext], ', evaluated to:', result);
        return result;
      }

      // Otherwise, treat as a liturgical season negation
      const result = !currentSeason.includes(excludedContext);
      console.log('DEBUG: Liturgical negation condition (extracted season:', excludedContext, ') evaluated to:', result);

      // During fasting periods, complex joyful conditions should return false
      if (currentSeason.includes('Nativity') ||
          currentSeason.includes('GreatFast') ||
          currentSeason.includes('ApostlesFast') ||
          currentSeason.includes('StMaryFast')) {
        console.log('DEBUG: During fasting period, returning FALSE for complex negation');
        return false;
      }

      return result;
    }

    // Use exact matching to avoid false positives
    // For example, "Nativity" should NOT match "Nativity Fast" - they are different seasons
    const result = currentSeason === condition;
    console.log('DEBUG: Simple condition evaluated to:', result, '(currentSeason:', currentSeason, 'condition:', condition, ')');
    return result;
  }

  private calculateOrthodoxEaster(year: number): Date {
    // Orthodox Easter calculation using the Julian calendar
    const a = year % 4;
    const b = year % 7;
    const c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31);
    const day = ((d + e + 114) % 31) + 1;

    // Convert Julian to Gregorian (add 13 days for 20th-21st centuries)
    let gregorianEaster = new Date(year, month - 1, day + 13);
    
    // Handle month overflow
    if (gregorianEaster.getDate() !== day + 13) {
      gregorianEaster = new Date(year, month, day + 13 - 31);
    }

    return gregorianEaster;
  }

  private isDateInRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date < end;
  }

  private getOrdinalNumber(number: number): string {
    const suffix: string = (() => {
      const lastDigit = number % 10;
      const lastTwoDigits = number % 100;
      
      // Handle special cases (11th, 12th, 13th)
      if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return 'th';
      }
      
      switch (lastDigit) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    })();
    
    return `${number}${suffix}`;
  }
}