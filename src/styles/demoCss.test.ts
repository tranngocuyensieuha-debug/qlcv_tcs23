import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('scope mọi selector giao diện dưới demo-shell và giữ breakpoint/palette demo', () => {
  const css = readFileSync('src/styles/demo.css', 'utf8');
  expect(css).toContain('background: #751117');
  expect(css).toContain('@media (max-width: 800px)');
  const selectors = [...css.matchAll(/(?:^|})([^{}]+)\{/gms)].map((match) => match[1].trim());
  const componentSelectors = selectors.filter((selector) => !selector.startsWith('@'));
  expect(componentSelectors.every((selector) => selector.split(',').every((part) => part.trim().startsWith('.demo-shell')))).toBe(true);
});
