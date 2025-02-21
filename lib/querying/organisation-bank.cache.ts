import { Service } from "typedi";
import { Token } from "../domain/token";
import { MemoryCache } from "../shared/memory-cache";

const TTL = 20 * 60 * 1000; // 20 Minutes

@Service(OrganisationBankCache.name)
export class OrganisationBankCache extends MemoryCache<string, Token[]> {
  constructor() {
    super(TTL);
  }
}
