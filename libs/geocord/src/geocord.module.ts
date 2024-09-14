import { Global, Module } from '@nestjs/common';
import { GeocordService } from './geocord.service';

@Global()
@Module({
  providers: [GeocordService],
  exports: [GeocordService],
})
export class GeocordModule {}
