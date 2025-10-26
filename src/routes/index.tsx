import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
  beforeLoad: () => {
    return {
      title: "Home",
    };
  },
});

function App() {
  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Home</h1>
      </div>
    </>
  );
}
