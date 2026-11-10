import { useEffect, useState } from 'react';

type Health = { status: string; database: string };

export function HomePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setError(true));
  }, []);

  return (
    <section>
      <h1>Centre d'accompagnement des retraités</h1>
      <p role="status">
        {error ? 'API injoignable' : health ? `API : ${health.status} (base ${health.database})` : 'Vérification de l\'API…'}
      </p>
    </section>
  );
}
