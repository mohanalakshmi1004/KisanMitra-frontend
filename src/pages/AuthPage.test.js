import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from './AuthPage';

beforeEach(() => {
  localStorage.clear();
});

test('renders Telugu labels when Telugu language is selected', () => {
  localStorage.setItem('nannaLanguage', 'te');

  render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  );

  expect(screen.getByText('లాగిన్')).toBeInTheDocument();
  expect(screen.getByText('సైన్ అప్')).toBeInTheDocument();
});
