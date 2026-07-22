import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Menu-Wave" },
      { name: "description", content: "Scan your table's QR code to view the menu and place your order." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="grid h-screen place-items-center px-4 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-3xl text-primary-foreground">
          🍽️
        </div>
        <h1 className="text-2xl font-bold text-foreground">Menu-Wave</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Scan the QR code at your table to view the menu and place your order.
        </p>
      </div>
    </div>
  );
}
