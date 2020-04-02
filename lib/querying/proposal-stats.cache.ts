import { Service } from "typedi";
import { ProposalStats } from "./proposal-stats";
import { MemoryCache } from "../shared/memory-cache";

const TTL = 20 * 60 * 1000; // 20 Minutes

@Service(ProposalStatsCache.name)
export class ProposalStatsCache extends MemoryCache<[string, number], ProposalStats> {
  constructor() {
    super(TTL);
  }
}
