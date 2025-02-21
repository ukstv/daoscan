import { SCRAPING_EVENT_KIND } from "./scraping-event.kind";
import { PLATFORM } from "../../domain/platform";
import { IScrapingEvent } from "./scraping-event.interface";
import { EventRecord } from "../../storage/event.record";
import { OrganisationRecord } from "../../storage/organisation.record";
import { EventRepository } from "../../storage/event.repository";
import { ConnectionFactory } from "../../storage/connection.factory";
import { OrganisationStorage } from "../../storage/organisation.storage";
import { RESOURCE_KIND } from "../../storage/resource.kind";
import { HistoryRepository } from "../../storage/history.repository";
import { HistoryRecord } from "../../storage/history.record";

export interface OrganisationCreatedEventProps {
  blockNumber: number;
  blockHash: string;
  platform: PLATFORM;
  timestamp: number;
  txid: string;
  name: string;
  address: string;
}

export class OrganisationCreatedEvent implements IScrapingEvent {
  readonly kind = SCRAPING_EVENT_KIND.ORGANISATION_CREATED;
  private readonly props: OrganisationCreatedEventProps;

  constructor(
    props: OrganisationCreatedEventProps,
    private readonly eventRepository: EventRepository,
    private readonly organisationStorage: OrganisationStorage,
    private readonly historyRepository: HistoryRepository,
    private readonly connectionFactory: ConnectionFactory
  ) {
    this.props = props;
  }

  get platform() {
    return this.props.platform;
  }

  get blockHash() {
    return this.props.blockHash;
  }

  get blockNumber() {
    return this.props.blockNumber;
  }

  get address() {
    return this.props.address;
  }

  get name() {
    return this.props.name;
  }

  get timestamp() {
    return this.props.timestamp;
  }

  get txid() {
    return this.props.txid;
  }

  async commit(): Promise<void> {
    const eventRow = this.buildEventRow();

    const organisationRow = new OrganisationRecord();
    organisationRow.name = this.name;
    organisationRow.platform = this.platform;
    organisationRow.address = this.address;
    organisationRow.createdAt = eventRow.timestamp;

    const historyRow = new HistoryRecord();
    historyRow.resourceKind = RESOURCE_KIND.ORGANISATION;

    const writing = await this.connectionFactory.writing();
    await writing.transaction(async entityManager => {
      const savedEvent = await entityManager.save(eventRow);
      console.log("Saved event", savedEvent);
      const savedOrganisation = await entityManager.save(organisationRow);
      console.log("Saved organisation", savedOrganisation);
      historyRow.eventId = savedEvent.id;
      historyRow.resourceId = savedOrganisation.id;
      const savedHistory = await entityManager.save(HistoryRecord, historyRow);
      console.log("Saved history", savedHistory);
    });
  }

  async revert(): Promise<void> {
    const eventRow = this.buildEventRow();
    const found = await this.eventRepository.findSame(eventRow);
    if (found) {
      const writing = await this.connectionFactory.writing();
      await writing.transaction(async entityManager => {
        await entityManager.delete(EventRecord, found);
        console.log("Deleted event", found);
        const historyRows = await this.historyRepository.allByEventIdAndKind(found.id, RESOURCE_KIND.ORGANISATION);
        const resourceIds = historyRows.map(h => h.resourceId.toString());
        if (resourceIds.length > 0) {
          const deleteResult = await entityManager.delete(OrganisationRecord, resourceIds);
          console.log(`Deleted ${deleteResult.affected} organisations`);
        }
        const deleteHistory = await entityManager.delete(HistoryRecord, { eventId: found.id });
        console.log(`Deleted ${deleteHistory.affected} histories`);
      });
    } else {
      console.log("Can not find event", this);
    }
  }

  buildEventRow() {
    const eventRow = new EventRecord();
    eventRow.platform = this.platform;
    eventRow.blockHash = this.blockHash;
    eventRow.blockId = BigInt(this.blockNumber);
    eventRow.payload = this;
    eventRow.timestamp = new Date(this.timestamp * 1000);
    eventRow.organisationAddress = this.address;
    eventRow.kind = this.kind;
    return eventRow;
  }

  toJSON() {
    return {
      ...this.props,
      kind: this.kind
    };
  }
}
