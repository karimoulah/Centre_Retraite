import { CalendarDays, MapPin } from 'lucide-react';

import { formatDateTime } from '@/lib/format';
import type { Activity } from '@/payload-types';

/** Grey card listing the next activities (date, time, place) — display only. */
export function ActivitiesCard({ activities, title = 'Prochaines activités' }: { activities: Activity[]; title?: string }) {
  return (
    <div className="rounded-2xl bg-surface-muted p-6 md:p-10">
      <div className="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(3,41,44,0.06)]">
        <h3 className="flex items-center gap-2 text-xl">
          <CalendarDays aria-hidden className="size-5" />
          {title}
        </h3>
        {activities.length === 0 ? (
          <p className="mt-4 text-text-muted">Aucune activité prévue pour le moment. Revenez bientôt !</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {activities.map((activity) => (
              <li key={activity.id} className="flex flex-col gap-1 py-4">
                <span className="font-medium">{activity.title}</span>
                <span className="text-[0.95rem] text-text-muted">
                  <time dateTime={activity.startsAt}>{formatDateTime(activity.startsAt)}</time>
                </span>
                {activity.location && (
                  <span className="flex items-center gap-1.5 text-[0.95rem] text-text-muted">
                    <MapPin aria-hidden className="size-4" />
                    {activity.location}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
