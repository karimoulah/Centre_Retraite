import { Module } from '@nestjs/common';

import { CategoriesController, CategoriesService } from './categories';

@Module({ controllers: [CategoriesController], providers: [CategoriesService], exports: [CategoriesService] })
export class FinanceModule {}
