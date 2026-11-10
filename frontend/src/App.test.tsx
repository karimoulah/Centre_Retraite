import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({ status: 'ok', database: 'up' }) }));
  });

  it("affiche le titre et le lien d'évitement", async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Centre d'accompagnement");
    expect(screen.getByText('Aller au contenu')).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('ok');
  });
});
