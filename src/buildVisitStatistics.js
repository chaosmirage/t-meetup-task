import sortBy from 'lodash/sortBy';
import get from 'lodash/get';

const getSessionTime = (start, end) => {
  const startSessionHours = new Date(start).getHours();
  const startSessionMinutes = (new Date(start).getMinutes()) / 60;

  const endSessionHours = new Date(end).getHours();
  const endSessionMinutes = (new Date(end).getMinutes()) / 60;

  const diff = (endSessionHours + endSessionMinutes) - (startSessionHours + startSessionMinutes);

  const preparedDiff = parseInt((diff) * 100, 10) / 100;
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

  const dataByUserId = sorted.reduce((acc, { id, ...rest }) => {
    const currentUserData = get(acc, [id], []);

    return { ...acc, [id]: [...currentUserData, rest] };
  }, {});

  const result = Object.keys(dataByUserId)
    .map((userId) => {
      const userVisitsData = dataByUserId[userId];

      let statistics = { time: 0, hasSuspiciousVisits: false, id: parseInt(userId, 10) };
      let startSessionData = null;
      let state = 'beforeSession'; // beforeSession, inSession, afterSession

      userVisitsData.forEach((userAction, id) => {
        const isLastAction = id === userVisitsData.length - 1;
        const { type, date } = userAction;

        const isForbiddenTime = checkIsForbiddenTime(date);

        if (isForbiddenTime) {
          statistics.hasSuspiciousVisits = true;
        }

        const isDateInPeriod = date >= parsedDateStart && date <= parsedDateEnd;

        if (!isDateInPeriod) {
          return;
        }

        switch (state) {
          case 'beforeSession':
            if (type === 'out') {
              statistics.hasSuspiciousVisits = true;
            }

            if (type === 'in' && isLastAction) {
              const sessionTime = getSessionTime(date, parsedDateEnd);
              const currentUserTime = statistics.time;
              const newTime = currentUserTime + sessionTime;

              statistics = { ...statistics, time: newTime };
              break;
            }

            if (type === 'in') {
              startSessionData = userAction;
              state = 'inSession';
              break;
            }

            break;
          case 'inSession':
            if (type === 'out') {
              const sessionTime = getSessionTime(startSessionData.date, date);
              const currentUserTime = statistics.time;
              const newTime = currentUserTime + sessionTime;

              statistics = { ...statistics, time: newTime };

              state = 'beforeSession';
            }

            break;
          default:
            break;
        }
      });

      return statistics;
    });

  return result;
};
