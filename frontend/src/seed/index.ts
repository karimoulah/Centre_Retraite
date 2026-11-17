import type { Payload } from 'payload';

import { heading, paragraph, richText } from './lexical';

const inDays = (days: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour + 5, minute, 0, 0); // Toronto (UTC-5) local time
  return date.toISOString();
};

/**
 * Demo content so the site is complete on a fresh database (development, CI, demo).
 * Runs once, when no page exists. Figures, coordinates and photos are placeholders
 * until the Centre provides the real ones (see the tracking file).
 */
export async function seed(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'pages' });
  if (totalDocs > 0) return;
  payload.logger.info('Seeding demo content…');

  const activities = [
    { title: 'Café-rencontre du mardi', startsAt: inDays(1, 10), location: 'Salle communautaire' },
    { title: 'Atelier tablette et appels vidéo', startsAt: inDays(3, 13, 30), location: 'Local informatique' },
    { title: 'Marche au parc', startsAt: inDays(5, 9, 30), location: 'Départ devant le Centre' },
    { title: 'Conférence : bien vivre sa retraite', startsAt: inDays(9, 14), location: 'Grande salle' },
  ];
  for (const activity of activities) {
    await payload.create({ collection: 'activities', data: { ...activity, published: true } });
  }

  const create = (data: Record<string, unknown>) =>
    payload.create({ collection: 'pages', data: { _status: 'published', ...data } as never });

  const about = await create({
    title: 'Le Centre',
    slug: 'a-propos',
    meta: { description: "Mission, valeurs et équipe du Centre d'accompagnement des retraités." },
    layout: [
      {
        blockType: 'content',
        title: 'Notre mission',
        body: richText(
          paragraph(
            "Le Centre d'accompagnement des retraités aide les personnes retraitées à rester actives, entourées et informées.",
          ),
          heading('Ce que nous offrons'),
          paragraph("Écoute et accompagnement, activités de groupe, ateliers pratiques et soutien aux proches aidants."),
        ),
      },
      { blockType: 'contactCards', title: 'Nous joindre' },
    ],
  });

  const activitiesPage = await create({
    title: 'Activités',
    slug: 'activites',
    meta: { description: 'Calendrier des prochaines activités du Centre.' },
    layout: [
      {
        blockType: 'upcomingActivities',
        eyebrow: 'Calendrier',
        title: 'Nos prochaines activités',
        text: 'Les activités sont gratuites pour les membres. Inscrivez-vous par téléphone ou à l’accueil.',
        limit: 6,
      },
    ],
  });

  const services = [
    ['Écoute et accompagnement', 'Une personne de l’équipe prend le temps de comprendre votre situation et vous oriente vers les bonnes ressources.'],
    ['Activités de groupe', 'Cafés-rencontres, marches, sorties culturelles : des occasions de créer des liens chaque semaine.'],
    ['Ateliers numériques', 'Apprivoiser la tablette, les appels vidéo et les services en ligne, à votre rythme.'],
    ['Soutien aux proches aidants', 'Information, répit et groupes d’échange pour les familles qui accompagnent un aîné.'],
    ['Aide aux formulaires', 'Pensions, crédits d’impôt, programmes gouvernementaux : on vous aide à vous y retrouver.'],
    ['Bénévolat', 'Donnez quelques heures par mois : accompagnement, accueil, animation d’ateliers.'],
  ].map(([title, description]) => ({ title, description }));

  const home = await create({
    title: 'Accueil',
    slug: 'home',
    meta: {
      title: "Les Aînés — Centre d'accompagnement des retraités",
      description: 'Écoute, activités et entraide pour les personnes retraitées et leurs proches.',
    },
    layout: [
      {
        blockType: 'hero',
        badge: 'Plus de 25 ans au service des aînés',
        title: 'Bien entouré,\nà chaque étape.',
        text: 'Écoute, activités et entraide pour les personnes retraitées et leurs proches. Un lieu chaleureux, une équipe qui prend le temps.',
        primaryAction: { label: 'Devenir membre', type: 'url', url: '/membership' },
        medallion: 'LES AÎNÉS • ENTRAIDE • ÉCOUTE •',
      },
      {
        blockType: 'stats',
        theme: 'dark',
        items: [
          { value: '1 200+', label: 'Membres actifs' },
          { value: '25 ans', label: "D'existence" },
          { value: '150', label: 'Activités par année' },
        ],
      },
      {
        blockType: 'logoStrip',
        theme: 'dark',
        title: 'Nos partenaires et subventionnaires',
        logos: [{ name: 'Partenaire A' }, { name: 'Partenaire B' }, { name: 'Partenaire C' }, { name: 'Partenaire D' }, { name: 'Partenaire E' }],
      },
      {
        blockType: 'aboutSplit',
        eyebrow: 'À propos du Centre',
        title: 'Là où les voisins deviennent une famille',
        text: 'Depuis plus de 25 ans, le Centre accueille les personnes retraitées du quartier pour briser l’isolement, partager et s’entraider.',
        highlight: { value: '25+', label: "Années d'existence" },
        items: [
          { title: 'Écoute et soutien', content: 'Une oreille attentive, sans rendez-vous, du lundi au vendredi.' },
          { title: 'Accompagnement personnalisé', content: 'Nous vous aidons dans vos démarches et vous dirigeons vers les bons services.' },
        ],
        showUpcomingActivities: true,
      },
      {
        blockType: 'featureSplit',
        title: 'Votre bien-être, notre engagement depuis 25 ans.',
        action: { label: 'Découvrir le Centre', type: 'page', page: about.id },
        cards: [
          { title: 'Soutien aux aînés', text: 'Accompagnement et réconfort au quotidien.', link: { type: 'page', page: about.id } },
          { title: 'Vie active', text: 'Des activités pour rester en forme et entouré.', link: { type: 'page', page: activitiesPage.id } },
        ],
      },
      {
        blockType: 'servicesList',
        eyebrow: 'Services',
        title: 'Un accompagnement à votre mesure',
        action: { label: 'Voir les activités', type: 'page', page: activitiesPage.id },
        services: services.map((service) => ({ ...service, link: { label: 'En savoir plus', type: 'page', page: about.id } })),
      },
      {
        blockType: 'featureRows',
        title: 'Nos activités phares',
        text: 'Chaque semaine, des rendez-vous simples et chaleureux pour garder le contact.',
        rows: [
          { title: 'Cafés-rencontres', text: 'Tous les mardis matin, autour d’un café et de petites douceurs.', link: { type: 'page', page: activitiesPage.id } },
          { title: 'Ateliers numériques', text: 'Tablette, courriel, appels vidéo : on apprend ensemble, sans pression.', link: { type: 'page', page: activitiesPage.id } },
          { title: 'Marches de quartier', text: 'Des sorties à pied adaptées à tous les rythmes, beau temps mauvais temps.', link: { type: 'page', page: activitiesPage.id } },
        ],
      },
      {
        blockType: 'testimonialsVideoGrid',
        title: 'Ils racontent leur Centre',
        text: 'Des membres, bénévoles et familles partagent ce que le Centre a changé pour eux.',
        limit: 3,
      },
      {
        blockType: 'testimonialCarousel',
        title: 'Ce que disent nos membres',
        text: 'Des témoignages recueillis avec le consentement de chaque personne.',
        limit: 6,
      },
    ],
  });

  // Unpublished page: must answer 404 to visitors (checked by the e2e tests).
  await payload.create({
    collection: 'pages',
    data: { title: 'Brouillon de démonstration', slug: 'brouillon-demo', _status: 'draft' },
    draft: true,
  });

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
        { label: 'Activités', type: 'page', page: activitiesPage.id },
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
            { label: 'Activités', type: 'page', page: activitiesPage.id },
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
}
