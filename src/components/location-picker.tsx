import { Crosshair, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export type PickedLocation = {
  lat: number;
  lng: number;
};

type LatLngLiteral = { lat: number; lng: number };

type GoogleMarker = {
  setPosition: (position: LatLngLiteral) => void;
  getPosition: () => { lat: () => number; lng: () => number } | null;
  addListener: (event: string, handler: () => void) => void;
};

type GoogleMap = {
  setCenter: (position: LatLngLiteral) => void;
  addListener: (event: string, handler: (payload: unknown) => void) => void;
};

type GoogleMapsApi = {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
    Marker: new (options: Record<string, unknown>) => GoogleMarker;
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
    __maketMapReady?: () => void;
  }
}

const YANGON: LatLngLiteral = { lat: 16.8409, lng: 96.1735 };

let loader: Promise<GoogleMapsApi> | null = null;

const loadMaps = (): Promise<GoogleMapsApi> => {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loader) return loader;

  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as
    | string
    | undefined;
  const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as
    | string
    | undefined;

  if (!key) return Promise.reject(new Error("Map is not available right now."));

  loader = new Promise<GoogleMapsApi>((resolve, reject) => {
    window.__maketMapReady = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Map failed to load."));
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__maketMapReady${
      channel ? `&channel=${channel}` : ""
    }`;
    script.async = true;
    script.onerror = () => reject(new Error("Map failed to load."));
    document.head.appendChild(script);
  });

  return loader;
};

const formatCoords = (value: PickedLocation): string =>
  `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`;

type LocationPickerProps = {
  value: PickedLocation | null;
  onChange: (value: PickedLocation) => void;
};

/** Lets the buyer drop a pin on their exact door so the seller gets a map link. */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    loadMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        const start = value ?? YANGON;
        const map = new google.maps.Map(containerRef.current, {
          center: start,
          zoom: value ? 17 : 12,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });
        const marker = new google.maps.Marker({ position: start, map, draggable: true });

        const publish = () => {
          const position = marker.getPosition();
          if (position) changeRef.current({ lat: position.lat(), lng: position.lng() });
        };

        marker.addListener("dragend", publish);
        map.addListener("click", (event: unknown) => {
          const point = event as { latLng?: { lat: () => number; lng: () => number } };
          if (!point.latLng) return;
          const next = { lat: point.latLng.lat(), lng: point.latLng.lng() };
          marker.setPosition(next);
          changeRef.current(next);
        });

        mapRef.current = map;
        markerRef.current = marker;
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });

    return () => {
      cancelled = true;
    };
    // Initialised once; later value updates are pushed to the marker below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Your phone did not share a location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        markerRef.current?.setPosition(next);
        mapRef.current?.setCenter(next);
        onChange(next);
        setLocating(false);
      },
      () => {
        setError("We could not read your location, drag the pin instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (error) {
    return <p className="text-xs text-muted-foreground">{error}</p>;
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="h-56 w-full overflow-hidden rounded-xl border border-border bg-muted"
        role="application"
        aria-label="Delivery location map"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useMyLocation}
          disabled={locating}
        >
          <Crosshair className="mr-1 size-3.5" />
          {locating ? "Finding you…" : "Use my location"}
        </Button>
        <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{value ? formatCoords(value) : "Tap the map to drop a pin"}</span>
        </p>
      </div>
    </div>
  );
}
