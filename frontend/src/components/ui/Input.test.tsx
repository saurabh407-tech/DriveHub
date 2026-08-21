import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders a label associated with the input', () => {
    render(<Input label="Email address" name="email" />);
    const input = screen.getByLabelText('Email address');
    expect(input).toBeInTheDocument();
  });

  it('shows an error message and marks the field as invalid', () => {
    render(<Input label="Email" name="email" error="Enter a valid email" />);
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a hint when there is no error', () => {
    render(<Input label="Password" name="password" hint="At least 8 characters" />);
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
  });

  it('prefers the error message over the hint when both are provided', () => {
    render(<Input label="Password" name="password" hint="At least 8 characters" error="Too short" />);
    expect(screen.getByText('Too short')).toBeInTheDocument();
    expect(screen.queryByText('At least 8 characters')).not.toBeInTheDocument();
  });

  it('calls onChange as the user types', async () => {
    const onChange = vi.fn();
    render(<Input label="Name" name="name" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Name'), 'Jordan');
    expect(onChange).toHaveBeenCalledTimes('Jordan'.length);
  });
});
