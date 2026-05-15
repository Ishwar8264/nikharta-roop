"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

import { Input } from "@/components/ui/input";

type BranchLocationSearchProps = {
  onSelectPlace: (placeId: string) => void;
};

// Uses Google Places predictions while keeping the UI controlled by our form.
export function BranchLocationSearch({ onSelectPlace }: BranchLocationSearchProps) {
  const places = useMapsLibrary("places");
  const [query, setQuery] = React.useState("");
  const [predictions, setPredictions] = React.useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const service = React.useMemo(
    () => places && new places.AutocompleteService(),
    [places],
  );

  React.useEffect(() => {
    if (!service || query.trim().length < 3) return;

    const timer = window.setTimeout(() => {
      service.getPlacePredictions(
        {
          componentRestrictions: { country: "in" },
          input: query,
          types: ["establishment", "geocode"],
        },
        (results) => setPredictions(results ?? []),
      );
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, service]);

  function handleSelect(prediction: google.maps.places.AutocompletePrediction) {
    setQuery(prediction.description);
    setPredictions([]);
    onSelectPlace(prediction.place_id);
  }

  function handleQueryChange(value: string) {
    setQuery(value);

    if (value.trim().length < 3) setPredictions([]);
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
      <Input
        className="h-11 bg-white pl-9"
        onChange={(event) => handleQueryChange(event.currentTarget.value)}
        placeholder="Search branch location"
        value={query}
      />
      {predictions.length ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
          {predictions.map((prediction) => (
            <button
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              key={prediction.place_id}
              onClick={() => handleSelect(prediction)}
              type="button"
            >
              {prediction.description}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
