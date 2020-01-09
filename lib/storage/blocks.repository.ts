import { DynamoService, IDynamoService } from "./dynamo.service";
import { Service, Inject } from "typedi";
import { ENV } from "../shared/env";
import { EnvService, IEnvService } from "../services/env.service";

@Service(BlocksRepository.name)
export class BlocksRepository {
  private readonly tableName: string;

  constructor(
    @Inject(DynamoService.name) private readonly dynamo: IDynamoService,
    @Inject(EnvService.name) env: IEnvService
  ) {
    this.tableName = env.readString(ENV.BLOCKS_TABLE);
  }

  async markParsed(id: number): Promise<void> {
    await this.dynamo.put({
      TableName: this.tableName,
      Item: {
        blockNumber: id
      }
    });
  }

  async isPresent(id: number): Promise<boolean> {
    const items = await this.dynamo.get({
      TableName: this.tableName,
      ProjectionExpression: "blockNumber",
      Key: {
        blockNumber: id
      }
    });
    return !!items.Item;
  }
}
