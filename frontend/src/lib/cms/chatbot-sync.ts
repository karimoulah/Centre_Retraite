import { createHmac } from 'node:crypto';

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

/**
 * Tells the API that a page changed, so the assistant's index follows the site (B11-01).
 * Signed with HMAC-SHA256 (shared secret). Fire and forget: a failure never blocks the editor,
 * and the next publication sends the page again. Off when CHATBOT_SYNC_URL is not set (mock mode).
 */
async function send(body: object) {
  const url = process.env.CHATBOT_SYNC_URL;
  const secret = process.env.CHATBOT_SYNC_SECRET;
  if (!url || !secret) return;
  const raw = JSON.stringify(body);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-signature': `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`,
      },
      body: raw,
    });
    if (!response.ok) console.warn(`[chatbot-sync] API answered ${response.status}`);
  } catch (error) {
    console.warn(`[chatbot-sync] API unreachable: ${String(error)}`);
  }
}

const pageUrl = (slug: string) => (slug === 'home' ? '/' : `/${slug}`);

/** Saving a draft must not drop the live page: what counts is the published version. */
export const syncPageToChatbot: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (!process.env.CHATBOT_SYNC_URL) return doc;
  const published = await req.payload
    .findByID({ collection: 'pages', id: doc.id, draft: false, depth: 0, overrideAccess: true })
    .catch(() => null);
  if (published?._status === 'published') {
    void send({
      event: 'upsert',
      page: {
        id: String(published.id),
        slug: published.slug,
        title: published.title,
        url: pageUrl(published.slug),
        layout: published.layout,
        meta: published.meta,
      },
    });
  } else {
    void send({ event: 'delete', page: { id: String(doc.id) } });
  }
  return doc;
};

export const removePageFromChatbot: CollectionAfterDeleteHook = async ({ doc }) => {
  void send({ event: 'delete', page: { id: String(doc.id) } });
  return doc;
};
