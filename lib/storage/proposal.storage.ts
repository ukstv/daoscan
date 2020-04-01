import { Inject, Service } from "typedi";
import { RepositoryFactory } from "./repository.factory";
import { ProposalRecord } from "./proposal.record";
import { OrganisationProposalConnectionQuery } from "./organisation-proposal-connection.query";
import { Memoize } from "typescript-memoize";

@Service(ProposalStorage.name)
export class ProposalStorage {
  constructor(@Inject(RepositoryFactory.name) private readonly repositoryFactory: RepositoryFactory) {}

  async byOrganisationAndIndex(organisationAddress: string, index: number) {
    const repository = await this.repositoryFactory.reading(ProposalRecord);
    return repository.findOne({
      organisationAddress,
      index
    });
  }

  async allByOrganisation(organisationAddress: string) {
    const repository = await this.repositoryFactory.reading(ProposalRecord);
    return repository
      .createQueryBuilder("proposal")
      .where("proposal.organisationAddress = :organisationAddress", { organisationAddress: organisationAddress })
      .addOrderBy("proposal.index", "DESC")
      .getMany();
  }

  async countByOrganisation(organisationAddress: string): Promise<number> {
    const repository = await this.repositoryFactory.reading(ProposalRecord);
    return repository
      .createQueryBuilder("proposal")
      .where("proposal.organisationAddress = :organisationAddress", { organisationAddress: organisationAddress })
      .getCount();
  }

  @Memoize()
  async connectionQuery(organisationAddress: string) {
    const repository = await this.repositoryFactory.reading(ProposalRecord);
    const query = repository
      .createQueryBuilder("proposal")
      .orderBy({ "proposal.index": "DESC" })
      .where("proposal.organisationAddress = :organisationAddress", { organisationAddress: organisationAddress });
    return new OrganisationProposalConnectionQuery(query);
  }

  async save(proposal: ProposalRecord) {
    const repository = await this.repositoryFactory.writing(ProposalRecord);
    return repository.save(proposal);
  }
}
