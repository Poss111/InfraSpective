import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../app/App';
import { useInfraStore } from '../state/useInfraStore';

describe('App smoke flows', () => {
  beforeEach(() => {
    useInfraStore.getState().clear();
    window.history.pushState({}, '', '/app');
  });

  it('renders the crawlable marketing home page', () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(screen.getByRole('heading', { name: /Visualize Terraform state and plan changes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open the tool/i })).toHaveAttribute('href', '/app');
  });

  it('renders the changelog page newest-first', () => {
    window.history.pushState({}, '', '/changelog');
    render(<App />);

    expect(screen.getByRole('heading', { name: /What changed in InfraSpective/i })).toBeInTheDocument();
    const releaseHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(releaseHeadings.map((heading) => heading.textContent)).toEqual([
      '0.1.3: Provider zones',
      '0.1.2: Safe graph exports',
      '0.1.1: Version updates',
      '0.1.0: Initial local-first release',
    ]);
  });

  it('loads demo state into the dashboard and clears it', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /load demo state/i }));

    expect(await screen.findByText(/Inventory/i)).toBeInTheDocument();
    expect(screen.getByText('InfraSpective')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /what's new/i })).toHaveAttribute('href', '/changelog');
    expect(screen.getByRole('button', { name: /export safe png/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy safe summary/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear state/i }));

    expect(await screen.findByText(/Upload terraform\.tfstate/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /what's new in/i })).toHaveAttribute('href', '/changelog');
  });

  it('loads demo plan into the plan dashboard and filters by action', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /plan json/i }));
    fireEvent.click(screen.getByRole('button', { name: /load demo plan/i }));

    expect(await screen.findByText(/Plan view/i)).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByText('Modify')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /what's new/i })).toHaveAttribute('href', '/changelog');
    expect(screen.getByRole('button', { name: /export safe png/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy safe summary/i })).toBeInTheDocument();

    const actionFilter = screen.getByLabelText(/Action/i);
    fireEvent.change(actionFilter, { target: { value: 'delete' } });

    await waitFor(() => expect(screen.getByText(/Changes \(1\)/i)).toBeInTheDocument());
    expect(screen.getAllByText(/aws_s3_bucket\.logs/i).length).toBeGreaterThan(0);
  });

  it('filters inventory by search text', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /load demo state/i }));

    const search = await screen.findByPlaceholderText(/search address/i);
    fireEvent.change(search, { target: { value: 'aws_s3_bucket' } });

    expect(screen.getAllByText(/aws_s3_bucket\.logs/i).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByText(/Inventory \(1\)/i)).toBeInTheDocument());
  });
});
