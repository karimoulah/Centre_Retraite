import { Body, Controller, Get, Injectable, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { conflict, notFound } from '../../common/app-error';
import { Roles } from '../../common/roles.decorator';
import { Tx } from '../../common/transaction/transaction.service';
import { UuidParam } from '../../common/uuid.pipe';
import { z } from '../../common/zod';
import { Category, ENTRY_DIRECTIONS, type EntryDirection } from '../../database/entities';
import { AuditService } from '../audit/audit.service';

const name = z.string().trim().min(1, 'Le nom est obligatoire.').max(80);

class CreateCategoryDto extends createZodDto(
  z
    .object({ name, direction: z.enum(ENTRY_DIRECTIONS), receiptEligible: z.boolean().default(false) })
    .refine((c) => !c.receiptEligible || c.direction === 'INCOME', {
      message: 'Seule une catégorie de recette peut donner droit à un reçu.',
      path: ['receiptEligible'],
    }),
) {}
class UpdateCategoryDto extends createZodDto(
  z.object({ name, receiptEligible: z.boolean(), active: z.boolean() }).partial().strict(),
) {}
class ListCategoriesQuery extends createZodDto(
  z.object({
    direction: z.enum(ENTRY_DIRECTIONS).optional(),
    active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  }),
) {}

/** GET /categories */
export const toCategory = (c: Category) => ({
  id: c.id,
  name: c.name,
  direction: c.direction,
  receiptEligible: c.receiptEligible,
  active: c.active,
  system: !!c.code,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

@Injectable()
export class CategoriesService {
  constructor(
    private readonly tx: Tx,
    private readonly audit: AuditService,
  ) {}

  /** Active first, then by name. Small list: no pagination. */
  async list(query: { direction?: EntryDirection; active?: boolean }) {
    const qb = this.tx.repo(Category).createQueryBuilder('c').orderBy('c.active', 'DESC').addOrderBy('lower(c.name)', 'ASC');
    if (query.direction) qb.andWhere('c.direction = :direction', { direction: query.direction });
    if (query.active !== undefined) qb.andWhere('c.active = :active', { active: query.active });
    return (await qb.getMany()).map(toCategory);
  }

  async create(dto: CreateCategoryDto) {
    const repo = this.tx.repo(Category);
    const saved = await repo.save(repo.create(dto));
    await this.audit.record({ action: 'CATEGORY_CREATED', entityType: 'Category', entityId: saved.id, entityLabel: saved.name, after: { ...dto } });
    return toCategory(await this.find(saved.id));
  }

  /** The direction never changes. A system category (online donations) stays active and keeps its receipt flag. */
  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.find(id);
    if (category.code && (dto.active === false || dto.receiptEligible === false)) {
      throw conflict('SYSTEM_CATEGORY', 'Cette catégorie est utilisée par les dons en ligne : elle reste active.');
    }
    if (dto.receiptEligible && category.direction !== 'INCOME') {
      throw conflict('RECEIPT_INCOME_ONLY', 'Seule une catégorie de recette peut donner droit à un reçu.', [
        { field: 'receiptEligible', message: 'Seule une catégorie de recette peut donner droit à un reçu.' },
      ]);
    }
    const keys = Object.keys(dto) as (keyof UpdateCategoryDto)[];
    const before = Object.fromEntries(keys.map((key) => [key, category[key]]));
    if (keys.length) await this.tx.repo(Category).update(id, dto);
    const updated = await this.find(id);
    const action = dto.active === false ? 'CATEGORY_DEACTIVATED' : dto.active === true && !category.active ? 'CATEGORY_REACTIVATED' : 'CATEGORY_UPDATED';
    await this.audit.record({ action, entityType: 'Category', entityId: id, entityLabel: updated.name, before, after: { ...dto } });
    return toCategory(updated);
  }

  async find(id: string): Promise<Category> {
    const category = await this.tx.repo(Category).findOneBy({ id });
    if (!category) throw notFound('Catégorie introuvable.');
    return category;
  }
}

@ApiTags('finance')
@Roles('FINANCE')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@Query() query: ListCategoriesQuery) {
    return this.categories.list(query);
  }

  @Post()
  create(@Body() body: CreateCategoryDto) {
    return this.categories.create(body);
  }

  /** Rename, receipt flag, deactivation (no deletion: entries keep their category). */
  @Patch(':id')
  update(@Param('id', UuidParam) id: string, @Body() body: UpdateCategoryDto) {
    return this.categories.update(id, body);
  }
}
