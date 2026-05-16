"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

import { Input } from "@/components/ui/input";

type BranchLocationSearchProps = {
  onSelectPlace: (prediction: google.maps.places.PlacePrediction) => void;
};

// Uses Google Places predictions while keeping the UI controlled by our form.
export function BranchLocationSearch({ onSelectPlace }: BranchLocationSearchProps) {
  const places = useMapsLibrary("places");
  const [query, setQuery] = React.useState("");
  const [predictions, setPredictions] = React.useState<
    google.maps.places.PlacePrediction[]
  >([]);
  const sessionToken =
    React.useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  React.useEffect(() => {
    if (!places || query.trim().length < 3) return;

    const timer = window.setTimeout(() => {
      sessionToken.current ??= new places.AutocompleteSessionToken();
      places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        includedRegionCodes: ["in"],
        input: query,
        sessionToken: sessionToken.current,
      }).then(({ suggestions }) => {
        setPredictions(
          suggestions.flatMap((suggestion) =>
            suggestion.placePrediction ? [suggestion.placePrediction] : [],
          ),
        );
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [places, query]);

  function handleSelect(prediction: google.maps.places.PlacePrediction) {
    setQuery(prediction.text.toString());
    setPredictions([]);
    onSelectPlace(prediction);
    sessionToken.current = null;
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
              key={prediction.placeId}
              onClick={() => handleSelect(prediction)}
              type="button"
            >
              {prediction.text.toString()}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
