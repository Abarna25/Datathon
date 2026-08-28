import { render, screen } from '@testing-library/react';
import App from './App';

test('renders VIKSHANA application brand or login screen', () => {
  render(<App />);
  // When unauthenticated, App redirects to /auth/login which displays VIKSHANA brand
  const brandElements = screen.getAllByText(/VIKSHANA/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
