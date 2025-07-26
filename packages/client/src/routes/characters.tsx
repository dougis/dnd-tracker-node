import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/characters')({
  component: Characters,
});

function Characters() {
  return (
    <div className="p-2">
      <h3>Characters</h3>
      <p>Character management page - to be implemented.</p>
    </div>
  );
}