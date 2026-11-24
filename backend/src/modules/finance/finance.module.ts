import { Module } from '@nestjs/common';

import { SettingsModule } from '../settings/settings.module';
import { CategoriesController, CategoriesService } from './categories';
import { ContributorsController, ContributorsService } from './contributors';
import { EntriesController } from './entries/entries.controller';
import { EntriesService } from './entries/entries.service';
import { ExpensesController, ExpensesService } from './entries/expenses';
import { ValidationController, ValidationService } from './entries/validation';

@Module({
  imports: [SettingsModule],
  controllers: [CategoriesController, ContributorsController, EntriesController, ExpensesController, ValidationController],
  providers: [CategoriesService, ContributorsService, EntriesService, ExpensesService, ValidationService],
  exports: [CategoriesService, ContributorsService, EntriesService, ExpensesService, ValidationService],
})
export class FinanceModule {}
