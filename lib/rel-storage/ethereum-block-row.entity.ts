import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryColumn } from "typeorm";

@Entity("ethereum_blocks")
export class EthereumBlockRow {
  @PrimaryColumn()
  // @ts-ignore
  id: number;

  @Column()
  // @ts-ignore
  hash: string;

  @BeforeInsert()
  @BeforeUpdate()
  private setHashToLowerCase() {
    this.hash = this.hash.toLowerCase();
  }
}
