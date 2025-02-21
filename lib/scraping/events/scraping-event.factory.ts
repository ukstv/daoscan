import { Inject, Service } from "typedi";
import { Block } from "../block";
import { ScrapingEvent } from "./scraping-event";
import { AragonEventFactory } from "../aragon/aragon-event.factory";
import { SCRAPING_EVENT_KIND } from "./scraping-event.kind";
import { UnreachableCaseError } from "../../shared/unreachable-case-error";
import { EventRepository } from "../../storage/event.repository";
import { Moloch1EventFactory } from "../moloch-1/moloch-1-event.factory";
import { AppInstalledEvent } from "./app-installed.event";
import { ApplicationRepository } from "../../storage/application.repository";
import { ConnectionFactory } from "../../storage/connection.factory";
import { OrganisationCreatedEvent } from "./organisation-created.event";
import { OrganisationStorage } from "../../storage/organisation.storage";
import { ShareTransferEvent } from "./share-transfer.event";
import { MembershipRepository } from "../../storage/membership.repository";
import { AddDelegateEvent } from "./add-delegate.event";
import { DelegateRepository } from "../../storage/delegate.repository";
import { HistoryRepository } from "../../storage/history.repository";
import { SetOrganisationNameEvent } from "./set-organisation-name.event";
import { SubmitProposalEvent } from "./submit-proposal.event";
import { NotImplementedError } from "../../shared/errors";
import { SubmitVoteEvent } from "./submit-vote.event";
import { ProcessProposalEvent } from "./process-proposal.event";
import { ProposalStorage } from "../../storage/proposal.storage";

@Service(ScrapingEventFactory.name)
export class ScrapingEventFactory {
  constructor(
    @Inject(AragonEventFactory.name) private readonly aragon: AragonEventFactory,
    @Inject(Moloch1EventFactory.name) private readonly moloch: Moloch1EventFactory,
    @Inject(EventRepository.name) private readonly eventRepository: EventRepository,
    @Inject(ApplicationRepository.name) private readonly applicationRepository: ApplicationRepository,
    @Inject(OrganisationStorage.name) private readonly organisationStorage: OrganisationStorage,
    @Inject(MembershipRepository.name) private readonly membershipRepository: MembershipRepository,
    @Inject(DelegateRepository.name) private readonly delegateRepository: DelegateRepository,
    @Inject(HistoryRepository.name) private readonly historyRepository: HistoryRepository,
    @Inject(ConnectionFactory.name) private readonly connectionFactory: ConnectionFactory,
    @Inject(ProposalStorage.name) private readonly proposalRepository: ProposalStorage
  ) {}

  async fromStorage(eventId: bigint): Promise<ScrapingEvent | undefined> {
    const row = await this.eventRepository.byId(eventId);
    if (row) {
      const payload = row.payload;
      return this.fromJSON(payload);
    } else {
      return undefined;
    }
  }

  fromJSON(json: ScrapingEvent): ScrapingEvent {
    switch (json.kind) {
      case SCRAPING_EVENT_KIND.APP_INSTALLED:
        return new AppInstalledEvent(
          json,
          this.eventRepository,
          this.applicationRepository,
          this.historyRepository,
          this.connectionFactory
        );
      case SCRAPING_EVENT_KIND.ORGANISATION_CREATED:
        return new OrganisationCreatedEvent(
          json,
          this.eventRepository,
          this.organisationStorage,
          this.historyRepository,
          this.connectionFactory
        );
      case SCRAPING_EVENT_KIND.SHARE_TRANSFER:
        return new ShareTransferEvent(
          json,
          this.eventRepository,
          this.membershipRepository,
          this.connectionFactory,
          this.historyRepository
        );
      case SCRAPING_EVENT_KIND.ADD_DELEGATE:
        return new AddDelegateEvent(json, this.connectionFactory, this.eventRepository, this.historyRepository);
      case SCRAPING_EVENT_KIND.SET_ORGANISATION_NAME:
        return new SetOrganisationNameEvent(
          json,
          this.organisationStorage,
          this.connectionFactory,
          this.historyRepository,
          this.eventRepository
        );
      case SCRAPING_EVENT_KIND.SUBMIT_PROPOSAL:
        return new SubmitProposalEvent(json, this.connectionFactory, this.eventRepository, this.historyRepository);
      case SCRAPING_EVENT_KIND.SUBMIT_VOTE:
        return new SubmitVoteEvent(json, this.connectionFactory, this.eventRepository, this.historyRepository);
      case SCRAPING_EVENT_KIND.PROCESS_PROPOSAL:
        return new ProcessProposalEvent(
          json,
          this.proposalRepository,
          this.connectionFactory,
          this.eventRepository,
          this.historyRepository
        );
      default:
        throw new UnreachableCaseError(json);
    }
  }

  async fromBlock(block: Block): Promise<ScrapingEvent[]> {
    const aragonEvents = await this.aragon.fromBlock(block);
    const molochEvents = await this.moloch.fromBlock(block);
    return aragonEvents.concat(molochEvents);
  }
}
