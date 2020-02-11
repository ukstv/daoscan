import { Inject, Service } from "typedi";
import { bind } from "decko";
import { ENV, EnvService } from "../services/env.service";
import { APIGatewayEvent } from "aws-lambda";
import { ForbiddenError } from "../shared/errors";
import { MigrationUpScenario } from "./migration-up.scenario";
import { EventRepository } from "../storage/event.repository";
import { ScrapingEventFactory } from "../scraping/events/scraping-event.factory";
import { BlockFactory } from "../scraping/block.factory";

@Service(MigrationController.name)
export class MigrationController {
  private readonly token: string;

  constructor(
    @Inject(MigrationUpScenario.name) private readonly upScenario: MigrationUpScenario,
    @Inject(EnvService.name) private readonly env: EnvService,
    @Inject(EventRepository.name) private readonly events: EventRepository,
    @Inject(ScrapingEventFactory.name) private readonly eventFactory: ScrapingEventFactory,
    @Inject(BlockFactory.name) private readonly blockFactory: BlockFactory
  ) {
    this.token = env.readString(ENV.UTIL_SECRET);
  }

  ensureAuthorization(event: APIGatewayEvent) {
    const authorizationHeader = event.headers["Authorization"];
    const expectedHeader = `Bearer ${this.token}`;
    if (authorizationHeader !== expectedHeader) {
      throw new ForbiddenError(`Authorization token is invalid`);
    }
  }

  @bind()
  async up(event: APIGatewayEvent): Promise<{ migrations: string[] }> {
    this.ensureAuthorization(event);
    const migrationNames = await this.upScenario.execute();
    return {
      migrations: migrationNames
    };
  }

  @bind()
  async timestamps(event: APIGatewayEvent): Promise<{ amount: number }> {
    this.ensureAuthorization(event);
    const rawEvents = await this.events.oldOnes();
    let n = 0;
    await Promise.all(
      rawEvents.map(async e => {
        const block = await this.blockFactory.fromEthereum(e.blockId);
        const timestampDate = await block.timestampDate();
        e.timestamp = timestampDate;
        await this.events.save(e);
        n = n + 1;
      })
    );

    return {
      amount: n
    };
  }
}
