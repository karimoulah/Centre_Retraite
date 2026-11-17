'use client';

import { Check, X } from 'lucide-react';

import { ConfirmDialog } from '@/components/backoffice/ConfirmDialog';
import { Button } from '@/components/ui/button';
import type { MembershipRequest } from '@/lib/api/contracts';

import { approveMembershipAction, rejectMembershipAction } from '../actions';

export function MembershipDecision({ request }: { request: MembershipRequest }) {
  const name = `${request.firstName} ${request.lastName}`;
  return (
    <div className="flex flex-wrap gap-3">
      <ConfirmDialog
        trigger={
          <Button variant="dark">
            <Check aria-hidden />
            Approuver
          </Button>
        }
        title={`Approuver la demande de ${name} ?`}
        consequence="Une fiche de membre sera créée et un courriel de bienvenue sera envoyé. Cette décision est inscrite au journal."
        confirmLabel="Approuver"
        onConfirm={() => approveMembershipAction(request.id)}
      />
      <ConfirmDialog
        trigger={
          <Button variant="outline">
            <X aria-hidden />
            Refuser
          </Button>
        }
        title={`Refuser la demande de ${name} ?`}
        consequence="La personne recevra un courriel l’informant du refus. Le motif reste interne au Centre."
        confirmLabel="Refuser la demande"
        tone="destructive"
        reason={{ label: 'Motif du refus', minLength: 5 }}
        onConfirm={(reason) => rejectMembershipAction(request.id, reason)}
      />
    </div>
  );
}
