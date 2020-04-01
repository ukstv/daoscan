import { ConnectionQuery } from "./connection-query";
import { ProposalRecord } from "./proposal.record";
import { OrganisationProposalConnectionCursor } from "./organisation-proposal-connection.cursor";
import { Repository } from "typeorm";

export class OrganisationProposalConnectionQuery extends ConnectionQuery<
  ProposalRecord,
  OrganisationProposalConnectionCursor
> {
  static build(repository: Repository<ProposalRecord>, organisationAddress: string) {
    const query = repository
      .createQueryBuilder("proposal")
      .orderBy({ "proposal.index": "DESC" })
      .where("proposal.organisationAddress = :organisationAddress", { organisationAddress: organisationAddress });
    return new OrganisationProposalConnectionQuery(query);
  }

  after(
    cursor: OrganisationProposalConnectionCursor,
    include: boolean
  ): ConnectionQuery<ProposalRecord, OrganisationProposalConnectionCursor> {
    const cmp = include ? "<=" : "<";
    const next = this.query.clone().andWhere(`${this.query.alias}.index ${cmp} :index`, {
      index: cursor.index
    });
    return new OrganisationProposalConnectionQuery(next);
  }

  before(
    cursor: OrganisationProposalConnectionCursor,
    include: boolean
  ): ConnectionQuery<ProposalRecord, OrganisationProposalConnectionCursor> {
    const cmp = include ? ">=" : ">";
    const next = this.query.clone().andWhere(`${this.query.alias}.index ${cmp} :index`, {
      index: cursor.index
    });
    return new OrganisationProposalConnectionQuery(next);
  }
}
