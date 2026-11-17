import { siteConfig } from '@/config/site';

// Temporary home page: replaced by the CMS-driven page in F3-02.
export default function HomePage() {
  return (
    <section>
      <h1>{siteConfig.legalName}</h1>
      <p>Le site est en cours de construction.</p>
    </section>
  );
}
