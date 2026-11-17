import type { Payload } from 'payload';

/**
 * Demo content so the site is complete on a fresh database (development, CI, demo).
 * Runs once, when no page exists. Coordinates are placeholders until the Centre confirms them.
 */
export async function seed(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'pages' });
  if (totalDocs > 0) return;
  payload.logger.info('Seeding demo content…');

  const create = (title: string, slug: string) =>
    payload.create({ collection: 'pages', data: { title, slug } });

  const home = await create('Accueil', 'home');
  const about = await create('Le Centre', 'a-propos');
  const activities = await create('Activités', 'activites');

  await payload.updateGlobal({
    slug: 'siteSettings',
    data: {
      phone: '(514) 555-0100',
      email: 'info@exemple.org',
      address: 'Adresse à confirmer\nMontréal (Québec)',
      openingHours: 'Du lundi au vendredi, de 9 h à 17 h',
      footerText:
        "Le Centre d'accompagnement des retraités offre écoute, activités et entraide aux personnes retraitées et à leurs proches.",
      socials: [
        { platform: 'facebook', url: 'https://www.facebook.com/' },
        { platform: 'youtube', url: 'https://www.youtube.com/' },
      ],
    },
  });

  await payload.updateGlobal({
    slug: 'mainMenu',
    data: {
      items: [
        { label: 'Accueil', type: 'page', page: home.id },
        { label: 'Le Centre', type: 'page', page: about.id },
        { label: 'Activités', type: 'page', page: activities.id },
        { label: 'Devenir membre', type: 'url', url: '/membership' },
        { label: 'Contact', type: 'url', url: '/contact' },
      ],
    },
  });

  await payload.updateGlobal({
    slug: 'footerMenus',
    data: {
      columns: [
        {
          title: 'Le Centre',
          links: [
            { label: 'Accueil', type: 'page', page: home.id },
            { label: 'À propos', type: 'page', page: about.id },
            { label: 'Activités', type: 'page', page: activities.id },
          ],
        },
        {
          title: 'Participer',
          links: [
            { label: 'Devenir membre', type: 'url', url: '/membership' },
            { label: 'Faire un don', type: 'url', url: '/donate' },
          ],
        },
        {
          title: 'Aide',
          links: [
            { label: 'Nous joindre', type: 'url', url: '/contact' },
            { label: 'Espace membre', type: 'url', url: '/login' },
          ],
        },
      ],
    },
  });

  return { home, about, activities };
}
