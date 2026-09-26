interface QueryLike {
  limit: () => unknown[];
  orderBy: () => QueryLike;
  where: () => QueryLike;
  then: (onFulfilled: (value: unknown[]) => unknown) => void;
}

interface ReturningLike {
  get: () => unknown;
  all: () => unknown[];
  then: (onFulfilled: (value: unknown[]) => unknown) => void;
}

interface RunResult {
  changes: number;
  lastInsertRowId: number;
}

const insertResult: unknown[] = [];
const insertValues: Record<string, unknown>[] = [];
const updateValues: Record<string, unknown>[] = [];
let deleteCalls = 0;
let selectQueue: unknown[][];

export const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  transaction: jest.fn(),
};

function nextRows(): unknown[] {
  return selectQueue.shift() ?? [];
}

function makeSelectQuery(rows: () => unknown[]): QueryLike {
  const q: QueryLike = {
    limit: () => rows(),
    orderBy: () => q,
    where: () => q,
    then: (onFulfilled) => {
      onFulfilled(rows());
    },
  };
  return q;
}

function makeReturning(rows: unknown[]): ReturningLike {
  return {
    get: () => rows[0],
    all: () => rows,
    then: (onFulfilled) => {
      onFulfilled(rows);
    },
  };
}

function emptyRun(): RunResult {
  return { changes: 0, lastInsertRowId: 0 };
}

export function resetDb(): void {
  selectQueue = [];
  insertResult.length = 0;
  insertValues.length = 0;
  updateValues.length = 0;
  deleteCalls = 0;
  jest.clearAllMocks();

  mockDb.select.mockImplementation(() => ({
    from: () => makeSelectQuery(() => nextRows()),
  }));

  mockDb.insert.mockImplementation((table: unknown) => ({
    values: (values: Record<string, unknown>) => {
      insertValues.push(values);
      return {
        returning: () => makeReturning(insertResult),
        run: () => emptyRun(),
      };
    },
  }));

  mockDb.update.mockImplementation(() => ({
    set: (values: Record<string, unknown>) => {
      updateValues.push(values);
      return {
        where: () => ({
          run: () => emptyRun(),
        }),
      };
    },
  }));

  mockDb.delete.mockImplementation(() => {
    deleteCalls += 1;
    return {
      where: () => ({
        run: () => emptyRun(),
      }),
    };
  });

  mockDb.transaction.mockImplementation((callback: (tx: typeof mockDb) => unknown) =>
    callback(mockDb),
  );
}

export function setSelectUsers(...users: unknown[]): void {
  selectQueue = [users];
}

export function setSelectResults(...rowSets: unknown[][]): void {
  selectQueue = [...rowSets];
}

export function setInsertResult(...rows: unknown[]): void {
  insertResult.length = 0;
  insertResult.push(...rows);
}

export function getInsertValues(): Record<string, unknown>[] {
  return insertValues;
}

export function getUpdateValues(): Record<string, unknown>[] {
  return updateValues;
}

export function getDeleteCalls(): number {
  return deleteCalls;
}

export const db = mockDb;