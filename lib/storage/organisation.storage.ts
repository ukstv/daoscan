import { Inject, Service } from "typedi";
import { RepositoryFactory } from "./repository.factory";
import { OrganisationRecord } from "./organisation.record";
import { PLATFORM } from "../domain/platform";
import { Memoize } from "typescript-memoize";
import { OrganisationConnectionQuery } from "./organisation-connection.query";

@Service(OrganisationStorage.name)
export class OrganisationStorage {
  readonly reading = this.repositoryFactory.reading(OrganisationRecord);
  readonly writing = this.repositoryFactory.writing(OrganisationRecord);

  constructor(@Inject(RepositoryFactory.name) private readonly repositoryFactory: RepositoryFactory) {}

  async byAddress(address: string): Promise<OrganisationRecord | undefined> {
    const repository = await this.reading;
    return repository.findOne({
      address: address
    });
  }

  @Memoize()
  async connectionQuery() {
    const repository = await this.reading;
    const query = repository.createQueryBuilder("org").orderBy({
      "org.createdAt": "DESC",
      "org.id": "DESC"
    });
    return new OrganisationConnectionQuery(query);
  }

  async count() {
    const repository = await this.reading;
    return repository.count();
  }

  async uniq() {
    const repository = await this.reading;
    const raw = await repository
      .createQueryBuilder("organisation")
      .select('count(distinct ("address"))', "count")
      .getRawOne();
    return Number(raw.count);
  }

  async all(platform: PLATFORM): Promise<OrganisationRecord[]> {
    const repository = await this.reading;
    return repository
      .createQueryBuilder("organisation")
      .where({ platform })
      .addOrderBy("organisation.id", "DESC")
      .getMany();
  }
}
