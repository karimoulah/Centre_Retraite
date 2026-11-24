import { randomUUID } from 'node:crypto';

import { Body, Controller, Delete, HttpCode, Injectable, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { AppError, conflict, fieldError } from '../../../common/app-error';
import { Roles } from '../../../common/roles.decorator';
import { Tx } from '../../../common/transaction/transaction.service';
import { UuidParam } from '../../../common/uuid.pipe';
import { z } from '../../../common/zod';
import { Entry } from '../../../database/entities';
import { MAX_UPLOAD_BYTES } from '../../../infrastructure/storage/storage.controller';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { AuditService } from '../../audit/audit.service';
import { EntriesService } from './entries.service';

export const ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
const UPLOAD_TTL = 10 * 60;

class RequestUploadDto extends createZodDto(
  z.object({
    fileName: z.string().trim().min(1).max(200),
    contentType: z.enum(ATTACHMENT_TYPES, { message: 'Formats acceptés : PDF, JPG ou PNG.' }),
    size: z.number().int().positive().max(MAX_UPLOAD_BYTES, 'Le fichier dépasse 10 Mo.'),
  }),
) {}
class ConfirmUploadDto extends createZodDto(z.object({ key: z.string().min(1).max(400), fileName: z.string().trim().min(1).max(200) })) {}

const safeName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.-]+/g, '-')
    .slice(-80) || 'piece';

/**
 * Receipts (B6-08): 1) ask for a signed upload URL, 2) the browser PUTs the file to storage,
 * 3) confirm: the API checks what was stored and attaches it. Possible until the entry is validated.
 */
@Injectable()
export class AttachmentsService {
  constructor(
    private readonly tx: Tx,
    private readonly entries: EntriesService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async requestUpload(id: string, dto: RequestUploadDto) {
    await this.editable(id);
    const key = `entries/${id}/${randomUUID()}-${safeName(dto.fileName)}`;
    const uploadUrl = await this.storage.signUpload(key, dto.contentType, UPLOAD_TTL);
    return { key, uploadUrl, method: 'PUT', headers: { 'content-type': dto.contentType }, expiresAt: new Date(Date.now() + UPLOAD_TTL * 1000).toISOString() };
  }

  async confirm(id: string, dto: ConfirmUploadDto) {
    const entry = await this.editable(id);
    if (!dto.key.startsWith(`entries/${id}/`)) throw fieldError(422, 'VALIDATION_FAILED', 'key', 'Ce fichier ne correspond pas à cette écriture.');
    const stored = await this.storage.stat(dto.key);
    if (!stored) throw new AppError(422, 'UPLOAD_MISSING', 'Le fichier n’a pas été reçu. Recommencez l’envoi.');
    if (stored.size > MAX_UPLOAD_BYTES || !ATTACHMENT_TYPES.includes(stored.contentType as (typeof ATTACHMENT_TYPES)[number])) {
      await this.storage.remove(dto.key);
      throw new AppError(422, 'INVALID_FILE', 'Formats acceptés : PDF, JPG ou PNG de 10 Mo au plus.');
    }
    const previous = entry.attachmentKey;
    await this.tx.repo(Entry).update(id, { attachmentKey: dto.key, attachmentName: dto.fileName, attachmentType: stored.contentType, attachmentSize: stored.size });
    await this.audit.record({
      action: 'ATTACHMENT_ADDED',
      entityType: 'Entry',
      entityId: id,
      entityLabel: entry.reference,
      before: previous ? { attachment: entry.attachmentName } : null,
      after: { attachment: dto.fileName, size: stored.size, type: stored.contentType },
    });
    return this.entries.detail(id);
  }

  async remove(id: string) {
    const entry = await this.editable(id);
    if (!entry.attachmentKey) return;
    await this.tx.repo(Entry).update(id, { attachmentKey: null, attachmentName: null, attachmentType: null, attachmentSize: null });
    await this.audit.record({ action: 'ATTACHMENT_REMOVED', entityType: 'Entry', entityId: id, entityLabel: entry.reference, before: { attachment: entry.attachmentName } });
  }

  private async editable(id: string): Promise<Entry> {
    const entry = await this.entries.lock(id);
    if (entry.status === 'VALIDATED' || entry.status === 'REJECTED') {
      throw conflict('ENTRY_LOCKED', 'La pièce d’une écriture validée ou refusée ne peut plus changer.');
    }
    return entry;
  }
}

@ApiTags('finance')
@Roles('FINANCE')
@Controller('entries/:id/attachment')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  /** Step 1: signed URL (PDF, JPG or PNG up to 10 MB, valid 10 minutes). */
  @Post()
  requestUpload(@Param('id', UuidParam) id: string, @Body() body: RequestUploadDto) {
    return this.attachments.requestUpload(id, body);
  }

  /** Step 3, after the PUT: attaches the stored file. */
  @HttpCode(200)
  @Post('confirm')
  confirm(@Param('id', UuidParam) id: string, @Body() body: ConfirmUploadDto) {
    return this.attachments.confirm(id, body);
  }

  @HttpCode(204)
  @Delete()
  async remove(@Param('id', UuidParam) id: string) {
    await this.attachments.remove(id);
  }
}
