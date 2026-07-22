import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PanelWindow } from './PanelWindow';

describe('PanelWindow', () => {
  it('shows the Chinese mock profile', () => {
    render(<PanelWindow />);
    expect(screen.getByRole('heading', { name: '花花' })).toBeInTheDocument();
    expect(screen.getByText(/原创卡通测试角色/)).toBeInTheDocument();
  });
});
