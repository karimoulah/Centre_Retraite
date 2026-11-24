export const CHATBOT_QUEUE = 'chatbot-index';

/** A page as Payload sends it (published pages only are indexed). */
export type SyncedPage = {
  id: string;
  slug: string;
  title: string;
  url: string;
  layout?: unknown;
  meta?: { description?: string };
};
export type SyncJob =
  { event: 'upsert'; page: SyncedPage } | { event: 'delete'; page: Pick<SyncedPage, 'id'> };
