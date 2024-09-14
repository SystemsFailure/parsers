import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { Retryable } from 'typescript-retry-decorator';

import { ProxyServersServiceContract } from './contracts';
import { TOKEN_CRM_RPC_REST } from './tokens';

@Injectable()
export class ProxyServersService implements ProxyServersServiceContract {
  constructor(
    @Inject(TOKEN_CRM_RPC_REST)
    private crmRpcRest: {
      host: `${string}/rpc`;
      token: string;
    },
  ) {}

  /**
   * Вызывает метод `getRandomProxyServer` из файла `app/Modules/ProxyServers/ProxyServersRandomizerService.ts` репозитория `api`
   */
  @Retryable({
    maxAttempts: 3,
    backOff: 5000,
  })
  public async getRandomProxyServer(region?: 'ua' | 'ru' | 'ro'): Promise<{
    host: string;
    port: string;
    username: string;
    password: string;
  }> {
    const url = new URL(
      `${this.crmRpcRest.host}/v1/proxy-servers/get-random/${this.crmRpcRest.token}`,
    );

    const { data } = await axios.post<{
      success: boolean;
      data: {
        host: string;
        port: number;
        auth: {
          username: string;
          password: string;
        };
      };
      message: string;
    }>(url.toString(), {
      type: region ?? 'all',
    });

    if (!data.success) {
      throw new Error(`Error get random proxy: ${data.message}`);
    }

    return {
      host: data.data.host,
      port: '' + data.data.port,
      username: data.data.auth.username,
      password: data.data.auth.password,
    };
  }
}
