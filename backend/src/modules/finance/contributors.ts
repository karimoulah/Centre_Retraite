import { Body, Controller, Get, Injectable, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { notFound } from '../../common/app-error';
import { listQuerySchema, paginate } from '../../common/pagination';
import { Roles } from '../../common/roles.decorator';
import { Tx } from '../../common/transaction/transaction.service';
import { UuidParam } from '../../common/uuid.pipe';
import { z } from '../../common/zod';
import { CONTRIBUTOR_KINDS, Contributor, Member } from '../../database/entities';
import { AuditService } from '../audit/audit.service';

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => value || null);

const fields = z.object({
  kind: z.enum(CONTRIBUTOR_KINDS).default('INDIVIDUAL'),
  name: z.string().trim().min(1, 'Le nom est obligatoire.').max(160),
  email: z
    .email()
    .trim()
    .toLowerCase()
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  phone: optional(30),
  address: optional(300),
  notes: optional(2000),
  memberId: z.uuid().nullable().optional(),
});
class CreateContributorDto extends createZodDto(fields) {}
class UpdateContributorDto extends createZodDto(fields.partial().strict()) {}
class ListContributorsQuery extends createZodDto(listQuerySchema.extend({ kind: z.enum(CONTRIBUTOR_KINDS).optional() })) {}

/** GET /contributors, GET /contributors/:id */
export const toContributor = (c: Contributor) => ({
  id: c.id,
  kind: c.kind,
  name: c.name,
  email: c.email,
  phone: c.phone,
  address: c.address,
  notes: c.notes,
  member: c.member ? { id: c.member.id, memberNumber: c.member.memberNumber, name: `${c.member.firstName} ${c.member.lastName}` } : null,
  createdAt: c.createdAt.toISOString(),
});

@Injectable()
export class ContributorsService {
  constructor(
    private readonly tx: Tx,
    private readonly audit: AuditService,
  ) {}

  /** Search by name or e-mail (the entry form's contributor picker uses it too). */
  list(query: ListContributorsQuery) {
    const qb = this.tx.repo(Contributor).createQueryBuilder('c').leftJoinAndSelect('c.member', 'm');
    if (query.kind) qb.andWhere('c.kind = :kind', { kind: query.kind });
    return paginate(
      qb,
      query,
      { sortable: { name: 'c.name', createdAt: 'c.createdAt' }, defaultSort: { key: 'name', order: 'asc' }, search: ['c.name', 'c.email'] },
      toContributor,
    );
  }

  async get(id: string) {
    return toContributor(await this.find(id));
  }

  async create(dto: CreateContributorDto) {
    await this.checkMember(dto.memberId);
    const repo = this.tx.repo(Contributor);
    const saved = await repo.save(repo.create({ ...dto, memberId: dto.memberId ?? null }));
    await this.audit.record({ action: 'CONTRIBUTOR_CREATED', entityType: 'Contributor', entityId: saved.id, entityLabel: saved.name, after: { ...dto } });
    return this.get(saved.id);
  }

  async update(id: string, dto: UpdateContributorDto) {
    const contributor = await this.find(id);
    await this.checkMember(dto.memberId);
    const keys = Object.keys(dto) as (keyof UpdateContributorDto)[];
    const before = Object.fromEntries(keys.map((key) => [key, contributor[key]]));
    if (keys.length) await this.tx.repo(Contributor).update(id, dto);
    const updated = await this.find(id);
    await this.audit.record({ action: 'CONTRIBUTOR_UPDATED', entityType: 'Contributor', entityId: id, entityLabel: updated.name, before, after: { ...dto } });
    return toContributor(updated);
  }

  /** Online donations: the contributor with this e-mail, otherwise a new one (linked to the member of that e-mail, if any). */
  async findOrCreateByEmail(email: string, name: string): Promise<Contributor> {
    const repo = this.tx.repo(Contributor);
    const existing = await repo.createQueryBuilder('c').where('lower(c.email) = lower(:email)', { email }).getOne();
    if (existing) return existing;
    const member = await this.tx
      .repo(Member)
      .createQueryBuilder('m')
      .where('lower(m.email) = lower(:email) AND m.anonymized_at IS NULL', { email })
      .andWhere('NOT EXISTS (SELECT 1 FROM app.contributors c WHERE c.member_id = m.id)')
      .getOne();
    const saved = await repo.save(repo.create({ name, email: email.toLowerCase(), memberId: member?.id ?? null }));
    await this.audit.record({ action: 'CONTRIBUTOR_CREATED', entityType: 'Contributor', entityId: saved.id, entityLabel: saved.name, after: { email: saved.email, source: 'online-donation' } });
    return saved;
  }

  async find(id: string): Promise<Contributor> {
    const contributor = await this.tx.repo(Contributor).findOne({ where: { id }, relations: { member: true } });
    if (!contributor) throw notFound('Contributeur introuvable.');
    return contributor;
  }

  private async checkMember(memberId: string | null | undefined) {
    if (memberId && !(await this.tx.repo(Member).existsBy({ id: memberId }))) throw notFound('Membre introuvable.');
  }
}

@ApiTags('finance')
@Roles('FINANCE')
@Controller('contributors')
export class ContributorsController {
  constructor(private readonly contributors: ContributorsService) {}

  @Get()
  list(@Query() query: ListContributorsQuery) {
    return this.contributors.list(query);
  }

  @Get(':id')
  get(@Param('id', UuidParam) id: string) {
    return this.contributors.get(id);
  }

  @Post()
  create(@Body() body: CreateContributorDto) {
    return this.contributors.create(body);
  }

  @Patch(':id')
  update(@Param('id', UuidParam) id: string, @Body() body: UpdateContributorDto) {
    return this.contributors.update(id, body);
  }
}
