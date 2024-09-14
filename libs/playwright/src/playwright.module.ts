import { DynamicModule, Module } from '@nestjs/common';
import { LaunchOptions, chromium } from 'playwright';

import { PlaywrightService } from './playwright.service';
import { TOKEN_BROWSER } from './tokens';

@Module({
  providers: [PlaywrightService],
  exports: [PlaywrightService],
})
export class PlaywrightModule {
  static forRoot(options: {
    launchOptions?: LaunchOptions;
    isGlobal?: boolean;
  }): DynamicModule {
    return {
      module: PlaywrightModule,
      providers: [
        {
          provide: TOKEN_BROWSER,
          async useFactory() {
            const browser = await chromium.launch(options.launchOptions);
            return browser;
          },
        },
      ],
      exports: [TOKEN_BROWSER],
      global: options.isGlobal,
    };
  }
}
