import { Link, Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <>
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <header>
        <nav aria-label="Navigation principale">
          <Link to="/">Accueil</Link>
        </nav>
      </header>
      <main id="contenu">
        <Outlet />
      </main>
    </>
  );
}
