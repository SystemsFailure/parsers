import { Inject, Injectable } from '@nestjs/common';
import { Browser, BrowserContextOptions } from 'playwright';

import { TOKEN_BROWSER } from './tokens';

@Injectable()
export class PlaywrightService {
  constructor(@Inject(TOKEN_BROWSER) private browser: Browser) {}

  public async createContext(options?: BrowserContextOptions) {
    return this.browser.newContext(options);
  }

  protected async onModuleDestroy() {
    await Promise.all(
      this.browser.contexts().map(async (context) => {
        await Promise.all(context.pages().map((page) => page.close()));
        await context.close();
      }),
    );
    await this.browser.close();
  }
}
