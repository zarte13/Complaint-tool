// React import not necessary with new JSX transform
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';

// Partial mock react-router-dom to preserve real exports like MemoryRouter
vi.mock('react-router-dom', async (importOriginal) => {
  const actual: any = await importOriginal();
  return Object.assign({}, actual, {
    // Mock only what we need; keep MemoryRouter, Link, etc. intact
    useNavigate: () => vi.fn(),
  });
});

import { MemoryRouter } from 'react-router-dom';
import Navigation from '../Navigation';

// Mock auth store module with a simple selector-based hook
const mockState = {
  isAuthenticated: false,
  accessToken: null as string | null,
  refreshToken: null as string | null,
  login: vi.fn(),
  logout: vi.fn(),
  setTokens: vi.fn(),
};

vi.mock('../../../stores/authStore', () => {
  return {
    useAuthStore: (selector?: (s: typeof mockState) => any) =>
      selector ? selector(mockState) : mockState,
  };
});

describe('Navigation', () => {
  beforeEach(() => {
    mockState.isAuthenticated = false;
    mockState.logout.mockClear();
  });

  it('renders public navigation items when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation />
      </MemoryRouter>
    );
    const possiblePublic = [/login/i, /home/i, /complaints/i];
    const found = possiblePublic.some((rx) => screen.queryByRole('link', { name: rx }) || screen.queryByText(rx));
    expect(found).toBe(true);
  });

  it('renders logout when authenticated and calls logout on click', () => {
    mockState.isAuthenticated = true;

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Navigation />
      </MemoryRouter>
    );

    const possibleLogoutText = [/logout/i, /sign out/i];
    const logoutButton =
      screen.queryByRole('button', { name: possibleLogoutText[0] }) ||
      screen.queryByRole('button', { name: possibleLogoutText[1] }) ||
      screen.queryByText(possibleLogoutText[0]) ||
      screen.queryByText(possibleLogoutText[1]);

    expect(logoutButton).toBeTruthy();

    if (logoutButton) {
      fireEvent.click(logoutButton);
      expect(mockState.logout).toHaveBeenCalledTimes(1);
    }
  });
});