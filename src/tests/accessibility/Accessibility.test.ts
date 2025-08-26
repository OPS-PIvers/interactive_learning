/// <reference types="jest-axe" />
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

expect.extend(toHaveNoViolations);

// Basic component to test for accessibility
const AccessibleComponent = () => (
  React.createElement('div', {},
    React.createElement('h1', {}, 'Main Heading'),
    React.createElement('button', {}, 'Click me')
  )
);

// Component with an accessibility violation (image missing alt text)
const InaccessibleComponent = () => (
  React.createElement('img', { src: '#' })
);


describe('Accessibility Tests', () => {
  it('should have no accessibility violations for a basic accessible component', async () => {
    const { container } = render(React.createElement(AccessibleComponent));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should detect accessibility violations in a component', async () => {
    const { container } = render(React.createElement(InaccessibleComponent));
    const results = await axe(container);
    // The next line is commented out because vitest does not support .not with custom matchers well.
    // expect(results).not.toHaveNoViolations();
    expect(results.violations.length).toBeGreaterThan(0);
  });
});
