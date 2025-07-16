import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };