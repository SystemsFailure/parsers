import { Module } from '@nestjs/common';

import { ParserV1Service } from './parser-v1.service';

@Module({
  providers: [ParserV1Service],
})
export class ParserV1Module {}
