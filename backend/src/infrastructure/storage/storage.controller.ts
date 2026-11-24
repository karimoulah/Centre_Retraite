import { Controller, Get, Headers, Param, Put, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AppError } from '../../common/app-error';
import { Public } from '../../common/public.decorator';
import { LocalStorageService } from './local-storage.service';
import { StorageService } from './storage.service';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Signed-URL endpoints of the local driver (the R2 driver never reaches them). */
@ApiExcludeController()
@Public()
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Put(':token')
  async upload(@Param('token') token: string, @Headers('content-type') type: string, @Req() req: Request, @Res() res: Response) {
    const grant = this.local().verify(token);
    if (!grant || grant.op !== 'put') throw new AppError(403, 'FORBIDDEN', 'Lien d’envoi invalide ou expiré.');
    if (type !== grant.type) throw new AppError(422, 'VALIDATION_FAILED', 'Le type du fichier ne correspond pas.');
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > MAX_UPLOAD_BYTES) throw new AppError(413, 'FILE_TOO_LARGE', 'Le fichier dépasse 10 Mo.');
      chunks.push(chunk as Buffer);
    }
    await this.local().write(grant.key, Buffer.concat(chunks), type);
    res.status(200).end();
  }

  @Get(':token')
  async download(@Param('token') token: string, @Res() res: Response) {
    const grant = this.local().verify(token);
    if (!grant || grant.op !== 'get') throw new AppError(403, 'FORBIDDEN', 'Lien expiré.');
    const file = await this.local().read(grant.key).catch(() => null);
    if (!file) throw new AppError(404, 'NOT_FOUND', 'Fichier introuvable.');
    const type = (await this.storage.stat(grant.key))?.contentType ?? 'application/octet-stream';
    res.setHeader('content-type', type);
    res.setHeader('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(grant.name ?? 'fichier')}`);
    res.send(file);
  }

  private local(): LocalStorageService {
    if (!(this.storage instanceof LocalStorageService)) throw new AppError(404, 'NOT_FOUND', 'Introuvable.');
    return this.storage;
  }
}
