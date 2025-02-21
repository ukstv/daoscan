import { IScrapingEvent } from "./scraping-event.interface";
import { SCRAPING_EVENT_KIND } from "./scraping-event.kind";
import { PLATFORM } from "../../domain/platform";
import { EventRecord } from "../../storage/event.record";
import { ConnectionFactory } from "../../storage/connection.factory";
import { DelegateRecord } from "../../storage/delegate.record";
import { EventRepository } from "../../storage/event.repository";
import { RESOURCE_KIND } from "../../storage/resource.kind";
import { HistoryRepository } from "../../storage/history.repository";
import { HistoryRecord } from "../../storage/history.record";

export interface AddDelegateEventProps {
  platform: PLATFORM;
  address: string;
  delegateFor: string;
  organisationAddress: string;
  blockHash: string;
  blockNumber: number;
  txid: string;
  logIndex: number;
  timestamp: Date;
}

export class AddDelegateEvent implements IScrapingEvent, AddDelegateEventProps {
  readonly kind = SCRAPING_EVENT_KIND.ADD_DELEGATE;

  constructor(
    private readonly props: AddDelegateEventProps,
    private readonly connectionFactory: ConnectionFactory,
    private readonly eventRepository: EventRepository,
    private readonly historyRepository: HistoryRepository
  ) {}

  get logIndex() {
    return this.props.logIndex;
  }

  get txid() {
    return this.props.txid;
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

  get delegateFor() {
    return this.props.delegateFor;
  }

  get organisationAddress() {
    return this.props.organisationAddress;
  }

  get timestamp() {
    return this.props.timestamp;
  }

  async commit(): Promise<void> {
    const eventRow = this.buildEventRow();

    const delegateRow = new DelegateRecord();
    delegateRow.address = this.address;
    delegateRow.delegateFor = this.delegateFor;
    delegateRow.organisationAddress = this.organisationAddress;

    const historyRow = new HistoryRecord();
    historyRow.resourceKind = RESOURCE_KIND.DELEGATE;

    const writing = await this.connectionFactory.writing();
    await writing.transaction(async entityManager => {
      const savedEvent = await entityManager.save(eventRow);
      console.log("Saved event", savedEvent);
      const savedDelegate = await entityManager.save(delegateRow);
      console.log("Saved delegate", savedDelegate);
      historyRow.resourceId = savedDelegate.id;
      historyRow.eventId = eventRow.id;
      const savedHistoryRow = await entityManager.save(HistoryRecord, historyRow);
      console.log("Saved history", savedHistoryRow);
    });
  }

  async revert(): Promise<void> {
    const eventRow = this.buildEventRow();
    const foundEvent = await this.eventRepository.findSame(eventRow);
    if (foundEvent) {
      const writing = await this.connectionFactory.writing();
      await writing.transaction(async entityManager => {
        await entityManager.delete(EventRecord, foundEvent);
        console.log("Deleted event", foundEvent);
        const historyRows = await this.historyRepository.allByEventIdAndKind(foundEvent.id, RESOURCE_KIND.DELEGATE);
        const resourceIds = historyRows.map(h => h.resourceId.toString());
        const deleteResult = await entityManager.delete(DelegateRecord, resourceIds);
        console.log(`Deleted ${deleteResult.affected} delegates`);
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
    eventRow.timestamp = this.timestamp;
    eventRow.organisationAddress = this.organisationAddress;
    eventRow.kind = this.kind;
    return eventRow;
  }

  toJSON(): any {
    return {
      ...this.props,
      kind: this.kind
    };
  }
}
