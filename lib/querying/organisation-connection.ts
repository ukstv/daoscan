import { IPagination } from "./pagination.interface";
import { Mutex } from "await-semaphore/index";
import { OrganisationConnectionCursor } from "../storage/organisation-connection.cursor";
import { Page } from "../storage/page";
import { OrganisationRepository } from "../domain/organisation.repository";
import { Organisation } from "../domain/organisation";

const DEFAULT_PAGE = 25;

export class OrganisationConnection {
  private _pageCache: Page<Organisation> | undefined;
  private pageMutex = new Mutex();

  constructor(
    private readonly pagination: IPagination,
    private readonly organisationRepository: OrganisationRepository
  ) {}

  async totalCount() {
    return this.organisationRepository.count();
  }

  async pageInfo() {
    const page = await this.page();
    const lastEdge = page.entries[page.entries.length - 1];
    const firstEdge = page.entries[0];
    const startCursor = firstEdge ? OrganisationConnectionCursor.build(firstEdge) : null;
    const endCursor = lastEdge ? OrganisationConnectionCursor.build(lastEdge) : null;
    return {
      endCursor: endCursor?.encode(),
      startCursor: startCursor?.encode(),
      hasNextPage: page.hasNextPage,
      hasPreviousPage: page.hasPreviousPage,
      startIndex: page.startIndex,
      endIndex: page.endIndex
    };
  }

  async edges() {
    const rows = await this.page();
    return rows.entries.map(organisation => {
      return {
        node: organisation,
        cursor: OrganisationConnectionCursor.build(organisation).encode()
      };
    });
  }

  async page() {
    return this.pageMutex.use(async () => {
      if (this._pageCache) {
        return this._pageCache;
      } else {
        this._pageCache = await this._page();
        return this._pageCache;
      }
    });
  }

  async _page() {
    if (this.pagination.before) {
      const take = this.pagination.last || DEFAULT_PAGE;
      const before = OrganisationConnectionCursor.decode(this.pagination.before);
      return this.organisationRepository.pageBefore(take, before);
    } else {
      const take = this.pagination.first || DEFAULT_PAGE;
      const after = this.pagination.after ? OrganisationConnectionCursor.decode(this.pagination.after) : undefined;
      return this.organisationRepository.pageAfter(take, after);
    }
  }
}
