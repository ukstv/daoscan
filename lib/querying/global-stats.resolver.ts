import { Inject, Service } from "typedi";
import { bind } from "decko";
import { MembershipRepository } from "../storage/membership.repository";
import { BlockRepository } from "../storage/block.repository";
import { OrganisationRepository } from "../domain/organisation.repository";

interface GlobalStats {
  organisationsCount: number;
  participantsCount: number;
  membershipsCount: number;
  lastBlock: number;
}

@Service(GlobalStatsResolver.name)
export class GlobalStatsResolver {
  constructor(
    @Inject(OrganisationRepository.name) private readonly organisationRepository: OrganisationRepository,
    @Inject(MembershipRepository.name) private readonly membershipRepository: MembershipRepository,
    @Inject(BlockRepository.name) private readonly blockRepository: BlockRepository
  ) {}

  @bind()
  async globalStats(): Promise<GlobalStats> {
    const organisationsCount = await this.organisationRepository.count();
    const participantsCount = await this.membershipRepository.participantsCount();
    const membershipsCount = await this.membershipRepository.membershipsCount();
    const lastBlock = await this.blockRepository.latest();
    return {
      organisationsCount: organisationsCount,
      participantsCount: participantsCount,
      membershipsCount: membershipsCount,
      lastBlock: lastBlock
    };
  }
}
