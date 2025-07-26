import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/encounters')({
  component: Encounters,
});

function Encounters() {
  return (
    <div className="p-2">
      <h3>Encounters</h3>
      <p>Encounter management page - to be implemented.</p>
    </div>
  );
}