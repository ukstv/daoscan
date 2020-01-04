import { DynamoService } from "./dynamo.service";
import { NotFoundError } from "../shared/errors";
import { Service, Inject } from "typedi";
import { OrganisationEntity } from "./organisation.entity";
import { ENV } from "../shared/env";
import { EnvService } from "../services/env.service";
import { PLATFORM } from "../shared/platform";

@Service(OrganisationsRepository.name)
export class OrganisationsRepository {
  private readonly tableName: string;

  constructor(
    @Inject(DynamoService.name) private readonly dynamo: DynamoService,
    @Inject(EnvService.name) env: EnvService
  ) {
    this.tableName = env.readString(ENV.ORGANISATIONS_TABLE);
  }

  async byAddress(address: string): Promise<OrganisationEntity> {
    const items = await this.dynamo.query({
      TableName: this.tableName,
      ProjectionExpression: "address, #orgName, platform, txid, #orgTimestamp, blockNumber",
      ExpressionAttributeNames: {
        "#orgName": "name",
        "#orgTimestamp": "timestamp"
      },
      KeyConditionExpression: "address = :address",
      ExpressionAttributeValues: {
        ":address": address.toLowerCase()
      },
      Limit: 1
    });
    if (items.Items && items.Items[0]) {
      const item = items.Items[0];
      return {
        address: item.address,
        name: item.name,
        platform: item.platform,
        txid: item.txid,
        blockNumber: item.blockNumber,
        timestamp: item.timestamp
      };
    } else {
      throw new NotFoundError(`Can not find organisation ${address}`);
    }
  }

  async all(): Promise<OrganisationEntity[]> {
    const items = await this.dynamo.scan({
      TableName: this.tableName,
      ProjectionExpression: "address, #orgName, platform, txid, #orgTimestamp, blockNumber",
      ExpressionAttributeNames: {
        "#orgName": "name",
        "#orgTimestamp": "timestamp"
      }
    });
    if (items.Items && items.Items.length) {
      return items.Items.map<OrganisationEntity>(item => {
        return {
          address: String(item.address),
          name: String(item.name),
          platform: PLATFORM.fromString(item.platform),
          txid: String(item.txid),
          timestamp: Number(item.timestamp),
          blockNumber: Number(item.blockNumber)
        };
      });
    } else {
      return [];
    }
  }

  async save(entity: OrganisationEntity) {
    await this.dynamo.put({
      TableName: this.tableName,
      Item: {
        address: entity.address.toLowerCase(),
        name: entity.name,
        platform: entity.platform,
        txid: entity.txid,
        timestamp: entity.timestamp,
        blockNumber: entity.blockNumber
      }
    });
  }
}
