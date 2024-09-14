import { Inject, Injectable } from '@nestjs/common';

import { ProxyServersServiceContract } from './contracts';
import { TOKEN_PROXIES_MOCK } from './tokens';

@Injectable()
export class ProxyServersServiceMock implements ProxyServersServiceContract {
  constructor(
    @Inject(TOKEN_PROXIES_MOCK)
    private readonly proxies?: { proxies: string[] },
  ) {}

  /**
   * Возвращает случайный прокси из файла .env.local из строки DEV_PROXIES
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRandomProxyServer(region?: 'ua' | 'ru' | 'ro') {
    if (!this.proxies?.proxies || this.proxies.proxies.length === 0) {
      return null;
    }

    const [host, port, username, password] = this.proxies.proxies[
      Math.floor(Math.random() * this.proxies.proxies.length)
    ]
      .split('@')
      .map((el) => el.split(':'))
      .flat();

    return { host, port, username, password };
  }
}
