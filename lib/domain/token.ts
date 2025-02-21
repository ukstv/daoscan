import { MessariService } from "../querying/messari.service";
import BigNumber from "bignumber.js";

export interface TokenProps {
  name: string | undefined;
  symbol: string | undefined;
  amount: string;
  decimals: number;
}

export class Token {
  readonly name = this.props.name;
  readonly symbol = this.props.symbol;
  readonly amount = this.props.amount;
  readonly decimals = this.props.decimals;

  constructor(private readonly props: TokenProps, protected readonly messari: MessariService) {}

  async value(targetSymbol: string): Promise<Token | undefined> {
    const usdPerUnit = await this.messari.usdPrice(this.symbol);
    const usdPerTarget = await this.messari.usdPrice(targetSymbol);
    if (usdPerUnit && usdPerTarget) {
      const tokenAmount = this.toBigNumber();
      const targetValue = tokenAmount.multipliedBy(usdPerUnit).div(usdPerTarget);
      const amount = (targetValue.toNumber() * 10 ** 4).toFixed(0);
      return new Token(
        {
          name: targetSymbol,
          symbol: targetSymbol,
          amount: amount,
          decimals: 4
        },
        this.messari
      );
    } else {
      return undefined;
    }
  }

  toBigNumber(): BigNumber {
    return new BigNumber(this.amount).div(10 ** this.decimals);
  }

  toJSON() {
    return {
      name: this.name,
      symbol: this.symbol,
      amount: this.amount,
      decimals: this.decimals
    };
  }
}
