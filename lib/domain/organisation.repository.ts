import { Inject, Service } from "typedi";
import { OrganisationStorage } from "../storage/organisation.storage";
import { EthereumService } from "../services/ethereum.service";
import { Organisation } from "./organisation";
import { OrganisationFactory } from "./organisation.factory";
import { OrganisationConnectionCursor } from "../storage/organisation-connection.cursor";
import { Page } from "../storage/page";
import { OrganisationRecord } from "../storage/organisation.record";

@Service(OrganisationRepository.name)
export class OrganisationRepository {
  constructor(
    @Inject(OrganisationStorage.name) private readonly organisationStorage: OrganisationStorage,
    @Inject(EthereumService.name) private readonly ethereum: EthereumService,
    @Inject(OrganisationFactory.name) private readonly organisationFactory: OrganisationFactory
  ) {}

  async count() {
    return this.organisationStorage.count();
  }

  async byAddress(address: string): Promise<Organisation | undefined> {
    const organisationAddress = await this.ethereum.canonicalAddress(address);
    if (!organisationAddress) return undefined;
    const record = await this.organisationStorage.byAddress(organisationAddress);
    if (!record) return undefined;
    return this.organisationFactory.fromRecord(record);
  }

  async pageAfter(take: number, after?: OrganisationConnectionCursor): Promise<Page<Organisation>> {
    const query = await this.organisationStorage.connectionQuery();
    const recordPage = await Page.after(query, take, after);
    return this.entityPage(recordPage);
  }

  async pageBefore(take: number, before: OrganisationConnectionCursor): Promise<Page<Organisation>> {
    const query = await this.organisationStorage.connectionQuery();
    const recordPage = await Page.before(query, take, before);
    return this.entityPage(recordPage);
  }

  entityPage(recordPage: Page<OrganisationRecord>): Page<Organisation> {
    return recordPage.map(e => this.organisationFactory.fromRecord(e));
  }
}
