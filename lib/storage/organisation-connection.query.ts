import { ConnectionQuery } from "./connection-query";
import { OrganisationRecord } from "./organisation.record";
import { OrganisationConnectionCursor } from "./organisation-connection.cursor";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";

type Base = ConnectionQuery<OrganisationRecord, OrganisationConnectionCursor>;

export class OrganisationConnectionQuery extends ConnectionQuery<OrganisationRecord, OrganisationConnectionCursor> {
  after(cursor: OrganisationConnectionCursor, include: boolean): Base {
    const cmp = include ? "<=" : "<";
    const next = this.query
      .clone()
      .where({ createdAt: LessThanOrEqual(cursor.createdAt) })
      .andWhere(`(${this.query.alias}.createdAt ${cmp} :createdAt OR ${this.query.alias}.id ${cmp} :id)`, {
        createdAt: cursor.createdAt.toISOString(),
        id: cursor.id.toString()
      });
    return new OrganisationConnectionQuery(next);
  }

  before(cursor: OrganisationConnectionCursor, include: boolean): Base {
    const cmp = include ? ">=" : ">";
    const next = this.query
      .clone()
      .where({ createdAt: MoreThanOrEqual(cursor.createdAt) })
      .andWhere(`(${this.query.alias}.createdAt ${cmp} :createdAt OR ${this.query.alias}.id ${cmp} :id)`, {
        createdAt: cursor.createdAt.toISOString(),
        id: cursor.id.toString()
      });
    return new OrganisationConnectionQuery(next);
  }
}
