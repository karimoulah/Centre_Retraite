'use client';

import { useCallback, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { FormAlert, FormErrorAlert, FormField, SubmitButton, Turnstile, useActionForm } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { sendContactMessage } from '../actions';
import { CONTACT_SUBJECTS, contactSchema, type ContactValues } from '../schemas';

export function ContactForm() {
  const [token, setToken] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const onToken = useCallback((value: string | null) => setToken(value), []);
  const { form, onSubmit, formError } = useActionForm<ContactValues>({
    schema: contactSchema,
    action: (values) => sendContactMessage(values, token),
    defaultValues: { name: '', email: '', phone: '', subject: 'info', message: '' },
    successToast: false,
    onSuccess: () => {
      setSent(true);
      form.reset();
    },
  });

  if (sent) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-start gap-4 rounded-2xl bg-surface-muted p-8">
        <CheckCircle2 aria-hidden className="size-10 text-status-success" />
        <h2 className="text-2xl">Merci, votre message est envoyé</h2>
        <p className="text-text-muted">Une personne de l’équipe vous répondra dans les deux jours ouvrables.</p>
        <Button variant="outline" onClick={() => setSent(false)}>
          Écrire un autre message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6" aria-label="Formulaire de contact">
      <FormErrorAlert result={formError} />
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField control={form.control} name="name" label="Votre nom" required>
          {(props) => <Input {...props} value={String(props.value)} autoComplete="name" />}
        </FormField>
        <FormField control={form.control} name="email" label="Adresse courriel" required>
          {(props) => <Input {...props} value={String(props.value)} type="email" autoComplete="email" />}
        </FormField>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField control={form.control} name="phone" label="Téléphone" description="Si vous préférez qu’on vous rappelle.">
          {(props) => <Input {...props} value={String(props.value)} type="tel" autoComplete="tel" />}
        </FormField>
        <FormField control={form.control} name="subject" label="Sujet" required>
          {({ value, onChange, onBlur, ...props }) => (
            <Select value={String(value)} onValueChange={onChange}>
              <SelectTrigger {...props} onBlur={onBlur} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_SUBJECTS.map((subject) => (
                  <SelectItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </div>
      <FormField control={form.control} name="message" label="Votre message" required>
        {(props) => <Textarea {...props} value={String(props.value)} rows={6} />}
      </FormField>
      <Turnstile onToken={onToken} />
      <FormAlert tone="info">
        Ne partagez pas d’informations médicales ou bancaires dans ce formulaire.
      </FormAlert>
      <div>
        <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Envoi…" size="lg">
          Envoyer le message
        </SubmitButton>
      </div>
    </form>
  );
}
