import { WorldMap } from "@/components/world-map/world-map";
import { getPlaces } from "@/lib/places";

/**
 * The hub.
 *
 * The document deliberately does not scroll here - the world-map spec requires the
 * scrollable height to stay equal to the viewport. Navigation happens through the
 * world, not through scroll position.
 */
export default async function HomePage(): Promise<React.ReactElement> {
  const places = await getPlaces();

  return (
    <main className="fixed inset-0 overflow-hidden">
      <WorldMap places={places} />
    </main>
  );
}
