/** French messages sent by the platform. Each type declares the data it needs. */
export type NotificationData = {
  MEMBERSHIP_RECEIVED: { firstName: string };
  MEMBERSHIP_APPROVED: { firstName: string; memberNumber: string; accountUrl?: string | null };
  USER_INVITATION: { firstName: string; url: string };
  PASSWORD_RESET: { firstName: string; url: string };
  CONTACT_MESSAGE: { name: string; email: string; phone?: string | null; subject: string; message: string };
  DONATION_CONFIRMED: { name: string; amountCents: number; reference: string; date: string };
};
export type NotificationType = keyof NotificationData;

type Rendered = { subject: string; text: string; replyTo?: string };

const money = (cents: number) => (cents / 100).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

const signature = "\n\nL'équipe du Centre d'accompagnement des retraités";

export const templates: { [K in NotificationType]: (data: NotificationData[K]) => Rendered } = {
  MEMBERSHIP_RECEIVED: (d) => ({
    subject: 'Nous avons bien reçu votre demande d’adhésion',
    text: `Bonjour ${d.firstName},\n\nMerci pour votre demande d’adhésion au Centre. Nous l’avons bien reçue et nous vous répondrons dans les prochains jours.${signature}`,
  }),
  MEMBERSHIP_APPROVED: (d) => ({
    subject: 'Bienvenue au Centre : votre adhésion est acceptée',
    text: `Bonjour ${d.firstName},\n\nVotre adhésion est acceptée. Votre numéro de membre est ${d.memberNumber}.${
      d.accountUrl ? `\n\nPour accéder à votre espace membre, choisissez votre mot de passe ici (lien valable 72 heures) :\n${d.accountUrl}` : ''
    }${signature}`,
  }),
  USER_INVITATION: (d) => ({
    subject: 'Votre accès à la plateforme du Centre',
    text: `Bonjour ${d.firstName},\n\nUn compte a été créé pour vous. Choisissez votre mot de passe ici (lien valable 72 heures) :\n${d.url}${signature}`,
  }),
  PASSWORD_RESET: (d) => ({
    subject: 'Réinitialisation de votre mot de passe',
    text: `Bonjour ${d.firstName},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n${d.url}\n\nSi vous n’avez rien demandé, ignorez ce message : votre mot de passe ne change pas.${signature}`,
  }),
  CONTACT_MESSAGE: (d) => ({
    subject: `[Contact] ${d.subject}`,
    text: `Message reçu par le formulaire de contact.\n\nNom : ${d.name}\nCourriel : ${d.email}\nTéléphone : ${d.phone || '—'}\n\n${d.message}`,
    replyTo: d.email,
  }),
  DONATION_CONFIRMED: (d) => ({
    subject: 'Merci pour votre don au Centre',
    text: `Bonjour ${d.name},\n\nNous avons bien reçu votre don de ${money(d.amountCents)} le ${d.date}. Merci de soutenir le Centre et ses membres.\n\nNuméro de référence : ${d.reference}\nConservez ce courriel : il confirme votre paiement. Le reçu fiscal, s’il y a lieu, vous sera envoyé séparément.${signature}`,
  }),
};

export function render<K extends NotificationType>(type: K, data: NotificationData[K]): Rendered {
  return templates[type](data);
}
