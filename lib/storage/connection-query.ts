import { SelectQueryBuilder } from "typeorm";

export abstract class ConnectionQuery<Entry, Cursor> {
  constructor(readonly query: SelectQueryBuilder<Entry>) {}

  abstract before(cursor: Cursor, include: boolean): ConnectionQuery<Entry, Cursor>;
  abstract after(cursor: Cursor, include: boolean): ConnectionQuery<Entry, Cursor>;

  getCount() {
    return this.query.getCount();
  }

  getMany() {
    return this.query.getMany();
  }

  skip(n: number): ConnectionQuery<Entry, Cursor> {
    const next = this.query.clone().skip(n);
    return new (this.constructor as any)(next);
  }

  take(n: number): ConnectionQuery<Entry, Cursor> {
    const next = this.query.clone().take(n);
    return new (this.constructor as any)(next);
  }
}
