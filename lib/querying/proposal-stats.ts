import { Proposal } from "../domain/proposal";
import { VoteRepository } from "../storage/vote.repository";
import { VOTE_DECISION } from "../domain/vote-decision";
import { VoteRecord } from "../storage/vote.record";
import { Shares } from "../domain/shares";
import BigNumber from "bignumber.js";
import { TokenFactory } from "../domain/token.factory";
import { Memoize } from "typescript-memoize";
import { Mutex } from "await-semaphore";

export class ProposalStats {
  private readonly mutex = new Mutex();

  constructor(
    private readonly proposal: Proposal,
    private readonly voteRepository: VoteRepository,
    private readonly tokenFactory: TokenFactory
  ) {}

  @Memoize()
  async yesVotes() {
    const votes = await this._yesVotes();
    return votes.length;
  }

  @Memoize()
  async noVotes() {
    const votes = await this._noVotes();
    return votes.length;
  }

  async yesShares() {
    const votes = await this._yesVotes();
    return this.votesToShares(votes);
  }

  async noShares() {
    const votes = await this._noVotes();
    return this.votesToShares(votes);
  }

  private async votesToShares(votes: VoteRecord[]) {
    const organisation = await this.proposal.organisation();
    const shares: Shares | undefined = await organisation?.shares();
    const sharesPerVote = await Promise.all(votes.map(async vote => shares?.balanceOf(vote.voter)));
    const sharesSum = sharesPerVote.reduce((acc, s) => (s ? acc.plus(s.toBigNumber()) : acc), new BigNumber(0));
    return this.tokenFactory.build({
      name: shares?.name,
      symbol: shares?.symbol,
      amount: sharesSum.toString(),
      decimals: shares?.decimals || 0
    });
  }

  @Memoize()
  private async _noVotes() {
    const votes = await this.votes();
    return votes.filter(v => v.decision === VOTE_DECISION.NO);
  }

  @Memoize()
  private async _yesVotes() {
    const votes = await this.votes();
    return votes.filter(v => v.decision === VOTE_DECISION.YES);
  }

  @Memoize()
  private votes(): Promise<VoteRecord[]> {
    return this.mutex.use(async () => {
      return this.voteRepository.allByProposal(this.proposal);
    });
  }
}
