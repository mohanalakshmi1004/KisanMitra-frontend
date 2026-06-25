import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders the home page without a token', () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getByText(/Smart Farming Tools/i)).toBeInTheDocument();
});

test('redirects protected routes to auth when no token exists', () => {
  localStorage.clear();
  window.history.pushState({}, '', '/weather');
  render(<App />);
  expect(screen.getByText(/Login/i)).toBeInTheDocument();
});
