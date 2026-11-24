import { Module } from '@nestjs/common';

import { CategoriesController, CategoriesService } from './categories';
import { ContributorsController, ContributorsService } from './contributors';

@Module({
  controllers: [CategoriesController, ContributorsController],
  providers: [CategoriesService, ContributorsService],
  exports: [CategoriesService, ContributorsService],
})
export class FinanceModule {}
