import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from '../App';

describe('App', () => {
  it('hiển thị màn hình đăng nhập hệ thống', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /đăng nhập hệ thống/i }),
    ).toBeInTheDocument();
  });
});
