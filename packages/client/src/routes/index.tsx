import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/' as any)({
  component: Index,
});

function Index() {
  // For now, redirect to login since we don't have a home page yet
  window.location.href = '/login';
  return <div>Redirecting...</div>;
}