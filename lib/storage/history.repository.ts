import { Inject, Service } from "typedi";
import { RepositoryFactory } from "./repository.factory";
import { HistoryRecord } from "./history.record";
import { RESOURCE_KIND } from "./resource.kind";

@Service(HistoryRepository.name)
export class HistoryRepository {
  constructor(@Inject(RepositoryFactory.name) private readonly repositoryFactory: RepositoryFactory) {}

  async forVote(resourceId: bigint) {
    return this.byResourceOrFail(resourceId, RESOURCE_KIND.VOTE);
  }

  async forProposal(resourceId: bigint) {
    return this.byResourceOrFail(resourceId, RESOURCE_KIND.PROPOSAL);
  }

  async allByResource(resourceId: bigint, resourceKind: RESOURCE_KIND) {
    const repository = await this.repositoryFactory.reading(HistoryRecord);
    return repository.find({
      resourceId: resourceId,
      resourceKind: resourceKind
    });
  }

  async byResourceOrFail(resourceId: bigint, resourceKind: RESOURCE_KIND): Promise<HistoryRecord> {
    const repository = await this.repositoryFactory.reading(HistoryRecord);
    return repository.findOneOrFail({
      resourceId: resourceId,
      resourceKind: resourceKind
    });
  }

  async allByEventIdAndKind(eventId: bigint, kind: RESOURCE_KIND) {
    const repository = await this.repositoryFactory.reading(HistoryRecord);
    return repository.find({
      where: {
        eventId: eventId,
        resourceKind: kind
      }
    });
  }
}
