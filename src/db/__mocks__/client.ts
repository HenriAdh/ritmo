import type { User } from '@/src/types';

const selectUsers: User[] = [];
const insertResult: User[] = [];

export const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
};

export function resetDb(): void {
  selectUsers.length = 0;
  insertResult.length = 0;

  mockDb.select.mockImplementation(() => ({
    from: () => ({
      where: () => ({
        limit: jest.fn(async () => selectUsers),
      }),
    }),
  }));

  mockDb.insert.mockImplementation(() => ({
    values: () => ({
      returning: jest.fn(async () => insertResult),
    }),
  }));
}

export function setSelectUsers(...users: User[]): void {
  selectUsers.length = 0;
  selectUsers.push(...users);
}

export function setInsertResult(...users: User[]): void {
  insertResult.length = 0;
  insertResult.push(...users);
}

export const db = mockDb;