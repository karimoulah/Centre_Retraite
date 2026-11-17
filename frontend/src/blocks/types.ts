import type { Page } from '@/payload-types';

export type LayoutBlock = NonNullable<Page['layout']>[number];
export type BlockProps<T extends LayoutBlock['blockType']> = Extract<LayoutBlock, { blockType: T }>;
