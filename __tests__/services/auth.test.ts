import type { User } from '@/src/types';
import { loginUser, registerUser } from '@/src/services/auth';

jest.mock('@/src/db/client');

type DbMock = typeof import('@/src/db/__mocks__/client');

function getDbMock(): DbMock {
  return jest.requireMock<DbMock>('@/src/db/client');
}

const SALT_HEX = '0102030405060708090a0b0c0d0e0f10';

function buildPasswordHash(salt: string, password: string): string {
  return `${salt}:digest-${salt}${password}`;
}

function makeUser(id: number, password: string): User {
  return {
    id,
    name: 'Ana',
    password_hash: buildPasswordHash(SALT_HEX, password),
    created_at: new Date(),
  };
}

beforeEach(() => {
  getDbMock().resetDb();
});

describe('registerUser', () => {
  it('valida nome em branco', async () => {
    await expect(registerUser({ name: '   ', password: '1234' })).rejects.toThrow(
      'Informe seu nome',
    );
  });

  it('valida senha curta', async () => {
    await expect(registerUser({ name: 'Ana', password: '123' })).rejects.toThrow(
      'A senha precisa ter pelo menos 4 caracteres',
    );
  });

  it('rejeita nome já em uso', async () => {
    getDbMock().setSelectUsers(makeUser(1, '1234'));

    await expect(registerUser({ name: 'Ana', password: '1234' })).rejects.toThrow(
      'Este nome já está em uso',
    );
  });

  it('cria usuário com hash salgado (salt:hash) e cria settings', async () => {
    getDbMock().setInsertResult(makeUser(1, '1234'));

    const user = await registerUser({ name: '  Ana  ', password: '1234' });

    expect(user.name).toBe('Ana');
    expect(user.password_hash).toBe(buildPasswordHash(SALT_HEX, '1234'));
  });
});

describe('loginUser', () => {
  it('rejeita usuário inexistente', async () => {
    await expect(loginUser({ name: 'Ana', password: '1234' })).rejects.toThrow(
      'Usuário não encontrado',
    );
  });

  it('rejeita senha incorreta', async () => {
    getDbMock().setSelectUsers(makeUser(1, '1234'));

    await expect(loginUser({ name: 'Ana', password: 'errada' })).rejects.toThrow(
      'Senha incorreta',
    );
  });

  it('loga com senha correta', async () => {
    getDbMock().setSelectUsers(makeUser(1, '1234'));

    const user = await loginUser({ name: 'Ana', password: '1234' });

    expect(user.id).toBe(1);
    expect(user.name).toBe('Ana');
  });
});