import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { resolveRestaurant, type Restaurant } from "@/lib/supabase";
import { MealBuilder } from "@/components/meal-builder/MealBuilder";

export const Route = createFileRoute("/$slug")({
  component: RestaurantPage,
});

function RestaurantPage() {
  const { slug } = Route.useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const r = await resolveRestaurant(slug);
      if (cancelled) return;
      if (!r) {
        setNotFound(true);
      } else {
        setRestaurant(r);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <div className="grid h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  if (notFound || !restaurant) {
    return (
      <div className="grid h-screen place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Restaurant not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't find a restaurant at this link. Please check the QR code or link and try again.
          </p>
        </div>
      </div>
    );
  }

  return <MealBuilder restaurant={restaurant} />;
}
