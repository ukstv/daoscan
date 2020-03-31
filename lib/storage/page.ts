import { ConnectionQuery } from "./connection-query";

export interface Page<Entry> {
  readonly startIndex: number;
  readonly endIndex: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly entries: Entry[];
}

export async function pageAfter<Entry, Cursor>(query: ConnectionQuery<Entry, Cursor>, take: number, cursor?: Cursor) {
  const totalCount = await query.getCount();
  if (cursor) {
    query = query.after(cursor, false);
  }
  const afterCount = await query.getCount();
  const entries = await query.take(take).getMany();
  const startIndex = totalCount - afterCount + 1;
  const endIndex = startIndex + entries.length - 1;
  return {
    startIndex: startIndex,
    endIndex: endIndex,
    hasNextPage: afterCount > take,
    hasPreviousPage: startIndex > 1,
    entries: entries
  };
}

export async function pageBefore<Entry, Cursor>(query: ConnectionQuery<Entry, Cursor>, take: number, cursor: Cursor) {
  const totalCount = await query.getCount();
  const before = query.before(cursor, false);

  const beforeCount = await before.getCount();
  const offset = beforeCount - take > 0 ? beforeCount - take : 0;

  const entries = await before
    .skip(offset)
    .take(take)
    .getMany();

  const startIndex = beforeCount - take + 1;
  const endIndex = startIndex + take - 1;
  const afterCount = totalCount - offset - take;

  return {
    startIndex: startIndex,
    endIndex: endIndex,
    hasPreviousPage: offset > 0,
    hasNextPage: afterCount > 0,
    entries: entries
  };
}
