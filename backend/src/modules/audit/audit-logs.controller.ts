import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { listQuerySchema, paginate } from '../../common/pagination';
import { Roles } from '../../common/roles.decorator';
import { Tx } from '../../common/transaction/transaction.service';
import { z } from '../../common/zod';
import { AuditLog } from '../../database/entities';
import { fullName } from '../users/user.mapper';

class ListAuditQuery extends createZodDto(
  listQuerySchema
    .extend({
      entityType: z.string().trim().max(60).optional(),
      /** userId is accepted as an alias of actorId. */
      actorId: z.uuid().optional(),
      userId: z.uuid().optional(),
      entityId: z.string().trim().max(100).optional(),
      action: z.string().trim().max(60).optional(),
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'La date de fin doit suivre la date de début.', path: ['to'] }),
) {}

/** Read-only journal (nothing in the API can change or delete a line). Days are counted in Montréal time. */
@ApiTags('audit')
@Roles('ADMIN')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly tx: Tx) {}

  @Get()
  list(@Query() query: ListAuditQuery) {
    const qb = this.tx.repo(AuditLog).createQueryBuilder('a').leftJoinAndSelect('a.actor', 'actor');
    const actorId = query.actorId ?? query.userId;
    if (query.entityType) qb.andWhere('a.entity_type = :entityType', { entityType: query.entityType });
    if (query.entityId) qb.andWhere('a.entity_id = :entityId', { entityId: query.entityId });
    if (query.action) qb.andWhere('a.action = :action', { action: query.action });
    if (actorId) qb.andWhere('a.actor_id = :actorId', { actorId });
    if (query.from) qb.andWhere("(a.at AT TIME ZONE 'America/Toronto')::date >= :from", { from: query.from });
    if (query.to) qb.andWhere("(a.at AT TIME ZONE 'America/Toronto')::date <= :to", { to: query.to });
    return paginate(
      qb,
      query,
      {
        sortable: { at: 'a.id', action: 'a.action', entityType: 'a.entityType', entityLabel: 'a.entityLabel' },
        defaultSort: { key: 'at', order: 'desc' },
        search: ['a.entityLabel', 'a.action'],
      },
      (a) => ({
        id: String(a.id),
        at: a.at.toISOString(),
        actor: a.actor ? { id: a.actor.id, name: fullName(a.actor) } : null,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        entityLabel: a.entityLabel,
        before: a.before,
        after: a.after,
      }),
    );
  }
}
