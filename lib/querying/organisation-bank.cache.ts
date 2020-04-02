import { Service } from "typedi";
import { CacheMap } from "../shared/cache-map";
import { Token } from "../domain/token";

const TTL = 20 * 60 * 1000; // 20 Minutes

@Service(OrganisationBankCache.name)
export class OrganisationBankCache extends CacheMap<string, Token[]> {
  constructor() {
    super(TTL);
  }
}
