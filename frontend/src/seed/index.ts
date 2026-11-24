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
  const fresh = totalDocs === 0;
  if (!fresh) {
    // Existing database: install the requirement-based menu once, keeping everything else.
    const upgraded = await payload.count({
      collection: 'pages',
      where: { slug: { equals: 'qui-sommes-nous' } },
    });
    if (upgraded.totalDocs > 0) return;
    payload.logger.info('Installation du menu des exigences…');
  } else {
    payload.logger.info('Seeding demo content…');
  }

  const activities = [
    { title: 'Café-rencontre du mardi', startsAt: inDays(1, 10), location: 'Salle communautaire' },
    {
      title: 'Atelier tablette et appels vidéo',
      startsAt: inDays(3, 13, 30),
      location: 'Local informatique',
    },
    { title: 'Marche au parc', startsAt: inDays(5, 9, 30), location: 'Départ devant le Centre' },
    {
      title: 'Conférence : bien vivre sa retraite',
      startsAt: inDays(9, 14),
      location: 'Grande salle',
    },
  ];
  if (fresh) {
    for (const activity of activities) {
      await payload.create({ collection: 'activities', data: { ...activity, published: true } });
    }
  }

  // Reuses a page that already exists (same slug) so an existing database keeps its content.
  const create = async (data: Record<string, unknown>) => {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: data.slug } },
      limit: 1,
      depth: 0,
    });
    if (existing.docs[0]) return existing.docs[0];
    return payload.create({
      collection: 'pages',
      data: { _status: 'published', ...data } as never,
    });
  };

  const about = await create({
    title: 'Qui sommes-nous ?',
    slug: 'qui-sommes-nous',
    meta: { description: "Vision, mission et valeurs du Centre d'accompagnement des retraités." },
    layout: [
      {
        blockType: 'content',
        anchor: 'vision',
        title: 'Notre vision',
        body: richText(
          paragraph(
            'Une communauté où chaque personne retraitée reste active, entourée et écoutée, à chaque étape de sa vie.',
          ),
        ),
      },
      {
        blockType: 'content',
        anchor: 'mission',
        title: 'Notre mission',
        body: richText(
          paragraph(
            "Le Centre d'accompagnement des retraités brise l'isolement et soutient l'autonomie des aînés : écoute, activités de groupe, ateliers pratiques et soutien aux proches aidants.",
          ),
        ),
      },
      {
        blockType: 'content',
        anchor: 'valeurs',
        title: 'Nos valeurs',
        body: richText(
          heading('Respect', 'h3'),
          paragraph('Chaque personne est accueillie telle qu’elle est, à son rythme.'),
          heading('Entraide', 'h3'),
          paragraph('Membres, bénévoles et équipe avancent ensemble.'),
          heading('Écoute', 'h3'),
          paragraph('Nous prenons le temps de comprendre avant de proposer.'),
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

  const testimonialsPage = await create({
    title: 'Témoignages des aînés',
    slug: 'temoignages',
    meta: {
      description:
        'Soumettre, écouter, visionner et partager les témoignages des membres du Centre.',
    },
    layout: [
      {
        blockType: 'content',
        anchor: 'soumettre',
        title: 'Soumettre un témoignage',
        body: richText(
          paragraph(
            "Vous êtes membre et souhaitez raconter ce que le Centre vous apporte ? Vous pourrez bientôt envoyer un texte, un enregistrement audio ou une vidéo depuis votre espace membre. En attendant, parlez-en à l'équipe : nous vous aiderons à l'enregistrer.",
          ),
        ),
      },
      {
        blockType: 'testimonialsVideoGrid',
        anchor: 'visionner',
        title: 'Visionner les témoignages',
        text: 'Des membres, bénévoles et familles racontent leur Centre.',
        limit: 3,
      },
      {
        blockType: 'content',
        anchor: 'ecouter',
        title: 'Écouter les témoignages',
        body: richText(
          paragraph(
            'Les témoignages audio, avec leur transcription écrite, seront publiés ici après l’accord de chaque personne.',
          ),
        ),
      },
      {
        blockType: 'testimonialCarousel',
        title: 'Ce que disent nos membres',
        text: 'Des témoignages recueillis avec le consentement de chaque personne.',
        limit: 6,
      },
      {
        blockType: 'content',
        anchor: 'partager',
        title: 'Partager un témoignage',
        body: richText(
          paragraph(
            'Un témoignage vous a touché ? Envoyez le lien de cette page à vos proches. Chaque témoignage publié l’est avec l’accord de son auteur, qui peut le retirer à tout moment.',
          ),
        ),
      },
    ],
  });

  const supportPage = await create({
    title: 'Soutenir le Centre',
    slug: 'soutenir',
    meta: { description: "Faire un don au Centre d'accompagnement des retraités." },
    layout: [
      {
        blockType: 'content',
        anchor: 'faire-un-don',
        title: 'Faire un don',
        body: richText(
          paragraph(
            'Vos dons financent les activités, les ateliers et l’accompagnement offerts aux aînés. Un reçu fiscal est remis pour chaque don admissible.',
          ),
          paragraph(
            'Donnez en ligne, par carte, en quelques minutes à l’adresse /donate : un courriel confirme votre don. Vous pouvez aussi donner par téléphone ou en personne au Centre.',
          ),
        ),
      },
      { blockType: 'contactCards', title: 'Nous joindre pour faire un don' },
    ],
  });

  const services = [
    [
      'Écoute et accompagnement',
      'Une personne de l’équipe prend le temps de comprendre votre situation et vous oriente vers les bonnes ressources.',
    ],
    [
      'Activités de groupe',
      'Cafés-rencontres, marches, sorties culturelles : des occasions de créer des liens chaque semaine.',
    ],
    [
      'Ateliers numériques',
      'Apprivoiser la tablette, les appels vidéo et les services en ligne, à votre rythme.',
    ],
    [
      'Soutien aux proches aidants',
      'Information, répit et groupes d’échange pour les familles qui accompagnent un aîné.',
    ],
    [
      'Aide aux formulaires',
      'Pensions, crédits d’impôt, programmes gouvernementaux : on vous aide à vous y retrouver.',
    ],
    [
      'Bénévolat',
      'Donnez quelques heures par mois : accompagnement, accueil, animation d’ateliers.',
    ],
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
        logos: [
          { name: 'Partenaire A' },
          { name: 'Partenaire B' },
          { name: 'Partenaire C' },
          { name: 'Partenaire D' },
          { name: 'Partenaire E' },
        ],
      },
      {
        blockType: 'aboutSplit',
        eyebrow: 'À propos du Centre',
        title: 'Là où les voisins deviennent une famille',
        text: 'Depuis plus de 25 ans, le Centre accueille les personnes retraitées du quartier pour briser l’isolement, partager et s’entraider.',
        highlight: { value: '25+', label: "Années d'existence" },
        items: [
          {
            title: 'Écoute et soutien',
            content: 'Une oreille attentive, sans rendez-vous, du lundi au vendredi.',
          },
          {
            title: 'Accompagnement personnalisé',
            content:
              'Nous vous aidons dans vos démarches et vous dirigeons vers les bons services.',
          },
        ],
        showUpcomingActivities: true,
      },
      {
        blockType: 'featureSplit',
        title: 'Votre bien-être, notre engagement depuis 25 ans.',
        action: { label: 'Qui sommes-nous ?', type: 'page', page: about.id },
        cards: [
          {
            title: 'Soutien aux aînés',
            text: 'Accompagnement et réconfort au quotidien.',
            link: { type: 'page', page: about.id },
          },
          {
            title: 'Vie active',
            text: 'Des activités pour rester en forme et entouré.',
            link: { type: 'page', page: activitiesPage.id },
          },
        ],
      },
      {
        blockType: 'servicesList',
        eyebrow: 'Services',
        title: 'Un accompagnement à votre mesure',
        action: { label: 'Voir les activités', type: 'page', page: activitiesPage.id },
        services: services.map((service) => ({
          ...service,
          link: { label: 'En savoir plus', type: 'page', page: about.id },
        })),
      },
      {
        blockType: 'featureRows',
        title: 'Nos activités phares',
        text: 'Chaque semaine, des rendez-vous simples et chaleureux pour garder le contact.',
        rows: [
          {
            title: 'Cafés-rencontres',
            text: 'Tous les mardis matin, autour d’un café et de petites douceurs.',
            link: { type: 'page', page: activitiesPage.id },
          },
          {
            title: 'Ateliers numériques',
            text: 'Tablette, courriel, appels vidéo : on apprend ensemble, sans pression.',
            link: { type: 'page', page: activitiesPage.id },
          },
          {
            title: 'Marches de quartier',
            text: 'Des sorties à pied adaptées à tous les rythmes, beau temps mauvais temps.',
            link: { type: 'page', page: activitiesPage.id },
          },
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

  if (fresh) {
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
  }

  const anchorLink = (label: string, path: string, anchor: string) => ({
    label,
    type: 'url' as const,
    url: `/${path}#${anchor}`,
  });

  await payload.updateGlobal({
    slug: 'mainMenu',
    data: {
      items: [
        { label: 'Accueil', type: 'page', page: home.id },
        {
          label: 'Qui sommes-nous ?',
          type: 'page',
          page: about.id,
          children: [
            anchorLink('Vision', 'qui-sommes-nous', 'vision'),
            anchorLink('Mission', 'qui-sommes-nous', 'mission'),
            anchorLink('Valeurs', 'qui-sommes-nous', 'valeurs'),
          ],
        },
        {
          label: 'Témoignages des aînés',
          type: 'page',
          page: testimonialsPage.id,
          children: [
            anchorLink('Soumettre', 'temoignages', 'soumettre'),
            anchorLink('Écouter', 'temoignages', 'ecouter'),
            anchorLink('Visionner', 'temoignages', 'visionner'),
            anchorLink('Partager', 'temoignages', 'partager'),
          ],
        },
        { label: 'Soutenir / Faire un don', type: 'page', page: supportPage.id },
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
            { label: 'Qui sommes-nous ?', type: 'page', page: about.id },
            { label: 'Activités', type: 'page', page: activitiesPage.id },
            { label: 'Témoignages des aînés', type: 'page', page: testimonialsPage.id },
          ],
        },
        {
          title: 'Participer',
          links: [
            { label: 'Devenir membre', type: 'url', url: '/membership' },
            { label: 'Soutenir / Faire un don', type: 'page', page: supportPage.id },
            { label: 'Faire un don en ligne', type: 'url', url: '/donate' },
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
