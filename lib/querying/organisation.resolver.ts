import { Inject, Service } from "typedi";
import { bind } from "decko";
import { EthereumService } from "../services/ethereum.service";
import { ParticipantPresentation } from "./participant.presentation";
import { MembershipRepository } from "../storage/membership.repository";
import { BalanceService } from "./balance.service";
import { Organisation } from "../domain/organisation";
import { OrganisationFactory } from "../domain/organisation.factory";
import { IToken } from "../domain/token.interface";

@Service(OrganisationResolver.name)
export class OrganisationResolver {
  constructor(
    @Inject(EthereumService.name) private readonly ethereum: EthereumService,
    @Inject(MembershipRepository.name) private readonly membershipRepository: MembershipRepository,
    @Inject(BalanceService.name) private readonly balance: BalanceService,
    @Inject(OrganisationFactory.name) private readonly organisationFactory: OrganisationFactory
  ) {}

  @bind()
  async organisation(address: string): Promise<Organisation | undefined> {
    return this.organisationFactory.byAddress(address);
  }

  @bind()
  async totalSupply(root: Organisation) {
    return root.shares();
  }

  @bind()
  async bank(root: Organisation) {
    return root.bank();
  }

  @bind()
  async shareValue(root: Organisation, args: { symbol: string }): Promise<IToken | undefined> {
    const shares = await root.shares();
    if (shares) {
      return shares.value(args.symbol);
    }
  }

  @bind()
  async participant(root: Organisation, args: { address: string }): Promise<ParticipantPresentation | null> {
    const participantAddress = await this.ethereum.canonicalAddress(args.address);
    const shares = await root.shares();
    const token = shares?.token;
    const participant = await this.membershipRepository.byAddressInOrganisation(root.address, participantAddress);
    if (participant && token) {
      const shares = await this.balance.balanceOf(participantAddress, token);
      return new ParticipantPresentation(participantAddress, shares);
    } else {
      return null;
    }
  }

  @bind()
  async participants(root: Organisation): Promise<ParticipantPresentation[]> {
    const shares = await root.shares();
    const token = shares?.token;
    const participants = await this.membershipRepository.allByOrganisationAddress(root.address);
    if (token) {
      const promised = participants.map(async p => {
        const shares = await this.balance.balanceOf(p.accountAddress, token);
        return new ParticipantPresentation(p.accountAddress, shares);
      });
      return await Promise.all(promised);
    } else {
      return [];
    }
  }
}
