import { ExtendedBlock } from "../ethereum.service";
import {
  KIT_ADDRESSES,
  KIT_SIGNATURES,
  NEW_APP_PROXY_EVENT,
  TOKEN_ABI,
  TOKEN_CONTROLLER_ABI, TRANSFER_EVENT
} from "./aragon.constants";
import {
  AppInstalledEvent,
  ORGANISATION_EVENT,
  ORGANISATION_PLATFORM,
  OrganisationCreatedEvent,
  OrganisationEvent,
  ShareTransferEvent
} from "../organisation-events";
import Web3 from "web3";
import { Scraper } from "./scraper.interface";
import { Indexed } from "../indexed.interface";
import { BlockchainEvent } from "./blockchain-event.interface";

export class AragonScraper implements Scraper {
  constructor(private readonly web3: Web3) {}

  async fromBlock(block: ExtendedBlock): Promise<OrganisationEvent[]> {
    const created = await this.createdFromTransactions(block);
    const appInstalled = await this.appInstalledEvents(block);
    const transfers = await this.transfers(block);

    return created.concat(appInstalled).concat(transfers);
  }

  async transfers(block: ExtendedBlock): Promise<OrganisationEvent[]> {
    const logs = block.logs;
    // is Transfer event
    return this.logEvents(block, TRANSFER_EVENT).map(e => {
      return {
        kind: ORGANISATION_EVENT.TRANSFER_SHARE,
        platform: ORGANISATION_PLATFORM.ARAGON,
        shareAddress: e.address,
        from: e._from,
        to: e._to,
        amount: e._amount
      }
    })
  }

  async kernelAddress(proxy: string): Promise<string> {
    const data = this.web3.eth.abi.encodeFunctionCall(
      {
        name: "kernel",
        type: "function",
        inputs: []
      },
      []
    );
    const result = await this.web3.eth.call({
      to: proxy,
      data
    });
    return this.web3.eth.abi.decodeParameter("address", result) as any;
  }

  async createdFromTransactions(block: ExtendedBlock): Promise<OrganisationEvent[]> {
    const whitelist = KIT_ADDRESSES;
    const abiMap = KIT_SIGNATURES;
    return Promise.all(
      block.receipts
        .filter(t => t.to && (whitelist.has(t.to.toLowerCase()) || whitelist.size === 0))
        .filter(t => abiMap.has(t.input.slice(0, 10)))
        .map(async t => {
          const signature = t.input.slice(0, 10);
          const abi = abiMap.get(signature)!;
          const parameters = this.web3.eth.abi.decodeParameters(abi, "0x" + t.input.slice(10));
          const ensName = `${parameters.name}.aragonid.eth`;
          const address = await this.web3.eth.ens.getAddress(ensName);

          const event: OrganisationCreatedEvent = {
            kind: ORGANISATION_EVENT.CREATED,
            platform: ORGANISATION_PLATFORM.ARAGON,
            name: ensName,
            address: address.toLowerCase(),
            txid: t.transactionHash,
            blockNumber: t.blockNumber,
            timestamp: Number(block.timestamp)
          };
          return event;
        })
    );
  }

  async appInstalledEvents(block: ExtendedBlock): Promise<OrganisationEvent[]> {
    const appInstalledPromised = this.logEvents(block, NEW_APP_PROXY_EVENT).map<Promise<AppInstalledEvent>>(async e => {
      const organisationAddress = await this.kernelAddress(e.proxy);
      return {
        kind: ORGANISATION_EVENT.APP_INSTALLED,
        platform: ORGANISATION_PLATFORM.ARAGON,
        organisationAddress: organisationAddress.toLowerCase(),
        appId: e.appId,
        proxyAddress: e.proxy,
        txid: e.txid,
        blockNumber: e.blockNumber,
        timestamp: Number(block.timestamp)
      };
    });
    const appsInstalled = await Promise.all(appInstalledPromised);
    const tokenControllerEvents = appsInstalled.filter(e => {
      return e.appId === "0x6b20a3010614eeebf2138ccec99f028a61c811b3b1a3343b6ff635985c75c91f";
    });
    for (let e of tokenControllerEvents) {
      const tokenControllerAddress = e.proxyAddress;
      const tokenController = new this.web3.eth.Contract(TOKEN_CONTROLLER_ABI, tokenControllerAddress);
      const tokenAddress = await tokenController.methods.token().call();
      const tokenEvent: AppInstalledEvent = {
        kind: ORGANISATION_EVENT.APP_INSTALLED,
        platform: ORGANISATION_PLATFORM.ARAGON,
        organisationAddress: e.organisationAddress,
        appId: "ds:share",
        proxyAddress: tokenAddress,
        txid: e.txid,
        blockNumber: e.blockNumber,
        timestamp: e.timestamp
      };
      appsInstalled.push(tokenEvent);
    }
    return appsInstalled;
  }

  logEvents<A extends Indexed<string>>(
    block: ExtendedBlock,
    event: BlockchainEvent<A>
  ): (A & { txid: string; blockNumber: number, address: string })[] {
    return block.logs
      .filter(log => log.topics[0] === event.signature)
      .map(log => {
        return {
          ...(this.web3.eth.abi.decodeLog(event.abi, log.data, log.topics) as A),
          address: log.address,
          txid: log.transactionHash,
          blockNumber: block.number
        };
      });
  }
}
