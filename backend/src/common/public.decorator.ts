import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
/** Opens a route to anonymous visitors (every other route requires a session). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
