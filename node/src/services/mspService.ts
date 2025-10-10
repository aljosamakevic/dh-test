import { MspClient } from '@storagehub-sdk/msp-client';
import type { InfoResponse, ValueProp } from '@storagehub-sdk/msp-client';

import { chainInfo } from '../../data/chainInfo.js';

export class MspService {
  private _mspClient: MspClient;
  private _mspInfo: InfoResponse | null = null;

  private constructor(mspClient: MspClient) {
    this._mspClient = mspClient;
  }

  static async create(): Promise<MspService> {
    const httpCfg = { baseUrl: chainInfo.baseUrl };
    const mspClient = await MspClient.connect(httpCfg);
    return new MspService(mspClient);
  }

  async getMspInfo(): Promise<InfoResponse> {
    if (!this._mspInfo) {
      this._mspInfo = await this._mspClient.getInfo();
    }
    return this._mspInfo;
  }

  get mspClient(): MspClient {
    return this._mspClient;
  }

  async getValuePropositions(): Promise<ValueProp[]> {
    const valueProps = await this._mspClient.getValuePropositions();
    if (!Array.isArray(valueProps) || valueProps.length === 0) {
      throw new Error('No value propositions available from this MSP.');
    }
    return valueProps;
  }

  async getFirstValuePropId(): Promise<`0x${string}`> {
    const valueProps = await this.getValuePropositions();
    return valueProps[0].id as `0x${string}`;
  }
}
