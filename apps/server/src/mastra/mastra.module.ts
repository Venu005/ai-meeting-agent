import { Module } from '@nestjs/common';
import { MastraClient } from './mastra.client';

@Module({
  providers: [MastraClient],
  exports: [MastraClient],
})
export class MastraModule {}
