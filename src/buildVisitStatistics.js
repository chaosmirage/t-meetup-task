import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import uniqBy from 'lodash/uniqBy';

const getSessionTime = (start, end) => {
  const startSessionHours = new Date(start).getHours();
  const startSessionMinutes = (new Date(start).getMinutes()) / 60;

  const endSessionHours = new Date(end).getHours();
  const endSessionMinutes = (new Date(end).getMinutes()) / 60;

  const diff = (endSessionHours + endSessionMinutes) - (startSessionHours + startSessionMinutes);

  const preparedDiff = parseInt((diff) * 10, 10) / 10;
  return preparedDiff;
};

const defaultConfig = {
  start: { hours: 23, minutes: 0 },
  end: { hours: 6, minutes: 0 },
};
const checkIsForbiddenTime = (date, config = defaultConfig) => {
  const hours = new Date(date).getHours();
  const minutes = new Date(date).getMinutes();

  return (hours >= config.start.hours || hours <= config.end.hours)
    && (minutes >= config.start.minutes || minutes <= config.end.minutes);
};

export default (data, dateStart, dateEnd) => {
  const parsedDateStart = (new Date(dateStart)).getTime();
  const parsedDateEnd = (new Date(dateEnd)).getTime();

  const sorted = sortBy(data, 'date');
  const dataByUserId = groupBy(sorted, 'id');

  const statistics = Object.keys(dataByUserId)
    .map((userId) => {
      const userVisitsData = uniqBy(dataByUserId[userId], 'date');

      let sessionStatistic = {
        time: 0,
        hasSuspiciousVisits: false,
        id: parseInt(userId, 10),
      };
      let startSessionData = null;
      let state = 'beforeSession'; // beforeSession, inSession

      userVisitsData.forEach((userAction, id) => {
        const isLastAction = id === userVisitsData.length - 1;
        const { type, date } = userAction;

        const isDateInPeriod = date >= parsedDateStart && date <= parsedDateEnd;
        if (!isDateInPeriod) {
          return;
        }

        const isForbiddenTime = checkIsForbiddenTime(date);
        if (isForbiddenTime) {
          sessionStatistic.hasSuspiciousVisits = true;
        }

        switch (state) {
          case 'beforeSession':
            if (type === 'out') {
              sessionStatistic.hasSuspiciousVisits = true;
            }

            if (type === 'in' && isLastAction) {
              const sessionTime = getSessionTime(date, parsedDateEnd);
              const currentUserTime = sessionStatistic.time;
              const newTime = currentUserTime + sessionTime;

              sessionStatistic = { ...sessionStatistic, time: newTime };
              break;
            }

            if (type === 'in') {
              startSessionData = userAction;
              state = 'inSession';
            }

            break;
          case 'inSession':
            if (type === 'out') {
              const sessionTime = getSessionTime(startSessionData.date, date);
              const currentUserTime = sessionStatistic.time;
              const newTime = currentUserTime + sessionTime;

              sessionStatistic = { ...sessionStatistic, time: newTime };

              state = 'beforeSession';
            }

            break;
          default:
            break;
        }
      });

      return sessionStatistic;
    });

  return statistics;
};
