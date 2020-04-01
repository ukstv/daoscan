import { IPagination } from "./pagination.interface";
import { ProposalStorage } from "../storage/proposal.storage";
import { Organisation } from "../domain/organisation";
import { Mutex } from "await-semaphore/index";
import { ProposalRecord } from "../storage/proposal.record";
import { ProposalFactory } from "../domain/proposal.factory";
import { OrganisationProposalConnectionCursor } from "../storage/organisation-proposal-connection.cursor";
import { Page, pageAfter, pageBefore } from "../storage/page";
import { Proposal } from "../domain/proposal";

const DEFAULT_PAGE_SIZE = 1;

function proposalToCursor(proposal: { index: number }) {
  return OrganisationProposalConnectionCursor.build(proposal).encode();
}

export class OrganisationProposalConnection {
  private pageMutex = new Mutex();
  private _pageCached: Page<Proposal> | undefined;

  constructor(
    private readonly organisation: Organisation,
    private readonly pagination: IPagination,
    private readonly proposalRepository: ProposalStorage,
    private readonly proposalFactory: ProposalFactory
  ) {}

  totalCount(): Promise<number> {
    return this.proposalRepository.countByOrganisation(this.organisation.address);
  }

  async edges() {
    const page = await this.page();
    return page.entries.map(proposal => {
      return {
        node: proposal,
        cursor: proposalToCursor(proposal)
      };
    });
  }

  async pageInfo() {
    const page = await this.page();
    const lastEdge = page.entries[page.entries.length - 1];
    const firstEdge = page.entries[0];
    const startCursor = firstEdge ? proposalToCursor(firstEdge) : null;
    const endCursor = lastEdge ? proposalToCursor(lastEdge) : null;
    return {
      endCursor: endCursor,
      startCursor: startCursor,
      hasNextPage: page.hasNextPage,
      hasPreviousPage: page.hasPreviousPage,
      startIndex: page.startIndex,
      endIndex: page.endIndex
    };
  }

  async page() {
    return this.pageMutex.use(async () => {
      if (this._pageCached) {
        return this._pageCached;
      } else {
        this._pageCached = await this._page();
        return this._pageCached;
      }
    });
  }

  async _page(): Promise<Page<Proposal>> {
    const query = await this.proposalRepository.connectionQuery(this.organisation.address);
    if (this.pagination.before) {
      const take = this.pagination.last || DEFAULT_PAGE_SIZE;
      const before = OrganisationProposalConnectionCursor.decode(this.pagination.before);
      const recordPage = await pageBefore(query, take, before);
      return this.entityPage(recordPage);
    } else {
      const take = this.pagination.first || DEFAULT_PAGE_SIZE;
      const after = this.pagination.after
        ? OrganisationProposalConnectionCursor.decode(this.pagination.after)
        : undefined;
      const recordPage = await pageAfter(query, take, after);
      return this.entityPage(recordPage);
    }
  }

  entityPage(recordPage: Page<ProposalRecord>): Page<Proposal> {
    const entries = recordPage.entries.map(e => this.proposalFactory.fromRecord(e));
    return {
      ...recordPage,
      entries
    };
  }
}
