import {
  deleteWeighIn,
  getCurrentWeighIn,
  getWeighInForDate,
  listWeighIns,
  saveWeighIn,
} from '@/src/services/weigh-ins';

jest.mock('@/src/db/client');

type DbMock = typeof import('@/src/db/__mocks__/client');

function getDbMock(): DbMock {
  return jest.requireMock<DbMock>('@/src/db/client');
}

beforeEach(() => {
  getDbMock().resetDb();
});

describe('listWeighIns', () => {
  it('devolve as pesagens do usuário', async () => {
    getDbMock().setSelectResults([
      { id: 1, user_id: 1, date: '2026-01-05', weight: 80, photo_uri: null, measurements: null },
      { id: 2, user_id: 1, date: '2026-01-20', weight: 79, photo_uri: null, measurements: null },
    ]);

    const result = await listWeighIns(1);

    expect(result).toHaveLength(2);
    expect(result.map((entry) => entry.date)).toEqual(['2026-01-05', '2026-01-20']);
  });
});

describe('getWeighInForDate', () => {
  it('devolve o registro do dia', async () => {
    getDbMock().setSelectResults([
      { id: 7, user_id: 1, date: '2026-01-20', weight: 79, photo_uri: null, measurements: null },
    ]);

    const result = await getWeighInForDate(1, '2026-01-20');

    expect(result?.id).toBe(7);
  });

  it('devolve null quando o dia ainda não foi registrado', async () => {
    getDbMock().setSelectResults([]);

    expect(await getWeighInForDate(1, '2026-01-20')).toBeNull();
  });
});

describe('getCurrentWeighIn', () => {
  it('devolve a pesagem mais recente', async () => {
    getDbMock().setSelectResults([
      { id: 9, user_id: 1, date: '2026-01-28', weight: 78, photo_uri: null, measurements: null },
    ]);

    expect((await getCurrentWeighIn(1))?.id).toBe(9);
  });

  it('devolve null quando o usuário nunca pesou', async () => {
    getDbMock().setSelectResults([]);

    expect(await getCurrentWeighIn(1)).toBeNull();
  });
});

describe('saveWeighIn', () => {
  it('atualiza quando já existe pesagem no dia, em vez de duplicar', async () => {
    getDbMock().setSelectResults([
      { id: 4, user_id: 1, date: '2026-01-20', weight: 80, photo_uri: null, measurements: null },
    ]);

    await saveWeighIn(1, { date: '2026-01-20', weight: 79 });

    expect(getDbMock().getUpdateValues()).toHaveLength(1);
    expect(getDbMock().getInsertValues()).toHaveLength(0);
    expect(getDbMock().getUpdateValues()[0]).toMatchObject({ weight: 79, photo_uri: null });
  });

  it('insere quando é a primeira pesagem do dia', async () => {
    getDbMock().setSelectResults([]);

    await saveWeighIn(1, { date: '2026-01-20', weight: 79 });

    expect(getDbMock().getInsertValues()).toHaveLength(1);
    expect(getDbMock().getUpdateValues()).toHaveLength(0);
  });

  it('guarda a uri da foto junto do peso', async () => {
    getDbMock().setSelectResults([]);

    await saveWeighIn(1, { date: '2026-01-20', weight: 79, photoUri: 'file:///foto.jpg' });

    expect(getDbMock().getInsertValues()[0]).toMatchObject({ photo_uri: 'file:///foto.jpg' });
  });

  it('apaga a referência da foto quando o envio vem sem ela', async () => {
    getDbMock().setSelectResults([
      {
        id: 4,
        user_id: 1,
        date: '2026-01-20',
        weight: 80,
        photo_uri: 'file:///antiga.jpg',
        measurements: null,
      },
    ]);

    await saveWeighIn(1, { date: '2026-01-20', weight: 79, photoUri: undefined });

    expect(getDbMock().getUpdateValues()[0]).toMatchObject({ photo_uri: null });
  });
});

describe('deleteWeighIn', () => {
  it('remove o registro pelo id', async () => {
    await deleteWeighIn(4);

    expect(getDbMock().getDeleteCalls()).toBe(1);
  });
});
