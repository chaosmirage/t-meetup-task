import buildVisitStatistics from '../src';

describe('buildVisitStatistics', () => {
  it('Test visits', () => {
    const DATA_MOCK = [
      {
        date: 1554192300000, // 2019-04-02T08:05:00.000Z
        id: 7,
        type: 'in',
      },
      {
        date: 1554185700000, // 2019-04-02T06:15:00.000Z
        id: 1,
        type: 'out',
      },
      {
        date: 1554200100000, // 2019-04-02T10:15:00.000Z
        id: 7,
        type: 'out',
      },
      {
        date: 1554202800000, // 2019-04-02T11:00:00.000Z
        id: 7,
        type: 'in',
      },
      {
        date: 1554204600000, // 2019-04-02T11:30:00.000Z
        id: 7,
        type: 'out',
      },
      {
        date: 1554192300000, // 2019-04-02T08:05:00.000Z
        id: 1,
        type: 'in',
      },
      {
        date: 1554202800000, // 2019-04-02T11:00:00.000Z
        id: 2,
        type: 'in',
      },
      {
        date: 1554192300000, // 2019-04-02T08:05:00.000Z
        id: 2,
        type: 'out',
      },
      {
        date: 1554185700000, // 2019-04-02T06:15:00.000Z
        id: 7,
        type: 'out',
      },
    ];

    const result = buildVisitStatistics(
      DATA_MOCK,
      '2019-04-02T08:00:00.000Z',
      '2019-04-02T12:00:00.000Z',
    );

    const expectResult = [
      {
        id: 1,
        time: 3.9, // (55 + 60 + 60 + 60) / 60 = 3,916666667
        hasSuspiciousVisits: false,
      },
      {
        id: 2,
        time: 1,
        hasSuspiciousVisits: true,
      },
      {
        id: 7,
        time: 2.6, // (55 + 60 + 15 + 30) / 60 = 2,666666667
        hasSuspiciousVisits: false,
      },
    ];

    expect(result).toEqual(expectResult);
  });

  it('23:00 - 6:00 warning', () => {
    const DATA_MOCK = [
      {
        date: 1554192000000, // 2019-04-02T08:00:00.000Z
        id: 2,
        type: 'in',
      },
      {
        date: 1554195600000, // 2019-04-02T09:00:00.000Z
        id: 2,
        type: 'out',
      },
      {
        date: 1554162900000, // 2019-04-01T23:55:00.000Z
        id: 2,
        type: 'in',
      },
      {
        date: 1554181200000, // 2019-04-02T05:00:00.000Z
        id: 2,
        type: 'out',
      },
    ];

    const result = buildVisitStatistics(
      DATA_MOCK,
      '2019-04-01T08:00:00.000Z',
      '2019-04-02T12:00:00.000Z',
    );

    const expectResult = [
      {
        id: 2,
        time: 6, // (305 + 60) / 60 = 6,083333333
        hasSuspiciousVisits: true,
      },
    ];

    expect(result).toEqual(expectResult);
  });

  it('Equal sessions', () => {
    const DATA_MOCK = [
      {
        date: 1554202800000, // 2019-04-02T11:00:00.000Z
        id: 7,
        type: 'in',
      },
      {
        date: 1554204600000, // 2019-04-02T11:30:00.000Z
        id: 7,
        type: 'out',
      },
      {
        date: 1554202800000, // 2019-04-02T11:00:00.000Z
        id: 7,
        type: 'in',
      },
      {
        date: 1554204600000, // 2019-04-02T11:30:00.000Z
        id: 7,
        type: 'out',
      },
    ];

    const result = buildVisitStatistics(
      DATA_MOCK,
      '2019-04-02T08:00:00.000Z',
      '2019-04-02T12:00:00.000Z',
    );

    const expectResult = [
      {
        id: 7,
        time: 0.5, // (55 + 60 + 15 + 30) / 60 = 2,666666667
        hasSuspiciousVisits: false,
      },
    ];

    expect(result).toEqual(expectResult);
  });
});
