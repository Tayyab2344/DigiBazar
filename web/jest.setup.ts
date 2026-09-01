import '@testing-library/jest-dom';

// Mock lucide-react icons for Jest DOM testing environment
jest.mock('lucide-react', () => {
  const React = require('react');
  return new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        const MockIcon = (props: any) =>
          React.createElement('svg', { ...props, 'data-testid': `icon-${prop}` });
        MockIcon.displayName = prop;
        return MockIcon;
      },
    }
  );
});
