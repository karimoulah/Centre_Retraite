import { Module } from '@nestjs/common';

import { CategoriesController, CategoriesService } from './categories';
import { ContributorsController, ContributorsService } from './contributors';
import { EntriesController } from './entries/entries.controller';
import { EntriesService } from './entries/entries.service';

@Module({
  controllers: [CategoriesController, ContributorsController, EntriesController],
  providers: [CategoriesService, ContributorsService, EntriesService],
  exports: [CategoriesService, ContributorsService, EntriesService],
})
export class FinanceModule {}
