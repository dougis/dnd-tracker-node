import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome to D&D Tracker!</h3>
      <p>
        This is a placeholder home page. The monorepo structure is now set up
        and ready for development.
      </p>
    </div>
  );
}