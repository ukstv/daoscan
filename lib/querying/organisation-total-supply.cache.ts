import { Service } from "typedi";
import { Shares } from "../domain/shares";
import { MemoryCache } from "../shared/memory-cache";

const TTL = 20 * 60 * 1000; // 20 Minutes

@Service(OrganisationTotalSupplyCache.name)
export class OrganisationTotalSupplyCache extends MemoryCache<string, Shares | undefined> {
  constructor() {
    super(TTL);
  }
}
