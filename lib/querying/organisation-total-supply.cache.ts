import { Service } from "typedi";
import { CacheMap } from "../shared/cache-map";
import { Shares } from "../domain/shares";

const TTL = 20 * 60 * 1000; // 20 Minutes

@Service(OrganisationTotalSupplyCache.name)
export class OrganisationTotalSupplyCache extends CacheMap<string, Shares | undefined> {
  constructor() {
    super(TTL);
  }
}
