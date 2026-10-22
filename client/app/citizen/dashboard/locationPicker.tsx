
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

type Props = {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (
    latitude: number,
    longitude: number,
    accuracy?: number | null
  ) => void;
  onPlaceSelect?: (address: string) => void;
};

type Place = {
  lat: string;
  lon: string;
  display_name: string;
  place_id: number;
};

const DEFAULT_CENTER: [number, number] = [12.2958, 76.6394];

const markerIcon = L.divIcon({
  className: "urbansathi-map-marker",
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: linear-gradient(145deg, #68a36d, #38643d);
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(38, 59, 42, 0.35);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapEvents({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapController({
  position,
}: {
  position: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();

      if (position) {
        map.setView(position, 17, { animate: false });
      }
    }, 50);

    return () => window.clearTimeout(timer);
  }, [map, position?.[0], position?.[1]]);

  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationSelect,
  onPlaceSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const searchController = useRef<AbortController | null>(null);
  const locationWatch = useRef<number | null>(null);
  const locationTimeout = useRef<number | null>(null);
  const bestReading = useRef<GeolocationPosition | null>(null);
  const locationFinished = useRef(false);

  const position: [number, number] | null =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
      ? [latitude, longitude]
      : null;

  const stopWatching = useCallback(() => {
    if (locationWatch.current !== null) {
      navigator.geolocation.clearWatch(locationWatch.current);
      locationWatch.current = null;
    }

    if (locationTimeout.current !== null) {
      window.clearTimeout(locationTimeout.current);
      locationTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      searchController.current?.abort();
      stopWatching();
    };
  }, [stopWatching]);

  async function searchPlaces() {
    const searchText = query.trim();

    if (searchText.length < 3) {
      setError("Enter at least 3 characters to search for a place.");
      return;
    }

    searchController.current?.abort();

    const controller = new AbortController();
    searchController.current = controller;

    setSearching(true);
    setError("");
    setPlaces([]);

    try {
      const params = new URLSearchParams({
        q: searchText,
        format: "jsonv2",
        limit: "5",
        countrycodes: "in",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Place search is temporarily unavailable. Please try again."
        );
      }

      const data: Place[] = await response.json();

      if (!data.length) {
        setError(
          "No matching place found. Try a landmark, street, area, or city."
        );
        return;
      }

      setPlaces(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to search for this place."
      );
    } finally {
      if (searchController.current === controller) {
        setSearching(false);
      }
    }
  }

  function choosePlace(place: Place) {
    const lat = Number(place.lat);
    const lng = Number(place.lon);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setError("The selected place returned invalid coordinates.");
      return;
    }

    setSelectedPlace(place.display_name);
    setQuery(place.display_name);
    setPlaces([]);
    setError("");
    setAccuracy(null);

    onLocationSelect(lat, lng, null);
    onPlaceSelect?.(place.display_name);
  }

  function finishLocationSearch() {
    if (locationFinished.current) return;

    locationFinished.current = true;
    stopWatching();
    setLocating(false);

    const reading = bestReading.current;

    if (!reading) {
      setError(
        "Unable to determine your location. Search for a place or select it on the map."
      );
      return;
    }

    const lat = reading.coords.latitude;
    const lng = reading.coords.longitude;
    const reportedAccuracy = reading.coords.accuracy;

    setAccuracy(reportedAccuracy);
    setSelectedPlace("Your device's current location");
    setQuery("Your device's current location");
    setPlaces([]);

    onLocationSelect(lat, lng, reportedAccuracy);

    if (reportedAccuracy > 100) {
      setError(
        `Your device reports an accuracy of approximately ${Math.round(
          reportedAccuracy
        )} metres. Try outdoors or adjust the marker manually.`
      );
    }
  }

  function useCurrentLocation() {
    setError("");
    setAccuracy(null);
    bestReading.current = null;
    locationFinished.current = false;
    stopWatching();

    if (!navigator.geolocation) {
      setError("Your browser does not support location detection.");
      return;
    }

    if (
      !window.isSecureContext &&
      window.location.hostname !== "localhost"
    ) {
      setError(
        "Location access requires HTTPS or localhost during development."
      );
      return;
    }

    setLocating(true);

    locationWatch.current = navigator.geolocation.watchPosition(
      (reading) => {
        if (
          !bestReading.current ||
          reading.coords.accuracy < bestReading.current.coords.accuracy
        ) {
          bestReading.current = reading;
        }

        if (reading.coords.accuracy <= 35) {
          finishLocationSearch();
        }
      },
      (geoError) => {
        if (locationFinished.current) return;

        if (geoError.code === geoError.PERMISSION_DENIED) {
          locationFinished.current = true;
          stopWatching();
          setLocating(false);
          setError(
            "Location permission was denied. Allow location access in your browser settings."
          );
          return;
        }

        if (bestReading.current) {
          finishLocationSearch();
        } else {
          locationFinished.current = true;
          stopWatching();
          setLocating(false);
          setError(
            "Unable to detect your location. Try searching for a place instead."
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );

    locationTimeout.current = window.setTimeout(() => {
      finishLocationSearch();
    }, 15000);
  }

  function selectMapPoint(lat: number, lng: number) {
    setAccuracy(null);
    setSelectedPlace("Custom map pin");
    setError("");
    onLocationSelect(lat, lng, null);
  }

  function removeLocation() {
    setAccuracy(null);
    setSelectedPlace("");
    setQuery("");
    setPlaces([]);
    setError("");
    onLocationSelect(NaN, NaN, null);
    onPlaceSelect?.("");
  }

  return (
    <section className="glossy-panel rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-[#263b2a]">
            Find a complaint location
          </h3>
          <p className="mt-1 text-sm text-[#647665]">
            Search by place name, landmark, road, or address.
          </p>
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="glossy-hover rounded-xl border border-[#dce8d8] bg-white px-4 py-3 text-sm font-semibold text-[#47784b] disabled:opacity-60"
        >
          {locating ? "Finding location…" : "◎ Use my location"}
        </button>
      </div>

      {/* This is a div, not a nested form. */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              void searchPlaces();
            }
          }}
          placeholder="e.g. Mysore Palace, VTU Belagavi..."
          aria-label="Search for a place"
          maxLength={200}
          className="min-w-0 flex-1 rounded-xl border border-[#dce8d8] bg-white px-4 py-3 text-sm text-[#263b2a] outline-none focus:border-[#719b73] focus:ring-4 focus:ring-[#e8f3e9]"
        />

        <button
          type="button"
          onClick={() => void searchPlaces()}
          disabled={searching}
          className="glossy-hover rounded-xl bg-[#47784b] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {searching ? "Searching…" : "Search place"}
        </button>
      </div>

      {places.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#dce8d8] bg-white">
          {places.map((place) => (
            <button
              type="button"
              key={place.place_id}
              onClick={() => choosePlace(place)}
              className="block w-full border-b border-[#edf1ea] px-4 py-3 text-left last:border-b-0 hover:bg-[#f1f7ee]"
            >
              <span className="block text-sm font-semibold text-[#344d37]">
                {place.display_name.split(",")[0]}
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#718071]">
                {place.display_name}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#dce8d8] bg-[#edf3e9]">
        {!mapLoaded && (
          <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center bg-[#edf3e9]">
            <span className="rounded-xl bg-white px-4 py-3 text-sm text-[#456348] shadow-sm">
              Loading map tiles…
            </span>
          </div>
        )}

        <MapContainer
          center={position ?? DEFAULT_CENTER}
          zoom={position ? 16 : 12}
          maxZoom={19}
          scrollWheelZoom
          preferCanvas
          className="h-[300px] w-full sm:h-[400px]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            eventHandlers={{
              tileload: () => setMapLoaded(true),
            }}
          />

          <MapEvents onSelect={selectMapPoint} />
          <MapController position={position} />

          {position && (
            <Marker
              position={position}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const point = event.target.getLatLng();
                  selectMapPoint(point.lat, point.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#647665]">
        Select a search result, click the map, or drag the marker to refine
        the location. Place search requires an internet connection.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800"
        >
          {error}
        </div>
      )}

      {position && (
        <div className="mt-4 rounded-2xl border border-[#dce8d8] bg-gradient-to-br from-white to-[#f2f8ef] p-4">
          <p className="text-sm font-semibold text-[#38643d]">
            ✓ {selectedPlace || "Location selected"}
          </p>

          <p className="mt-2 break-words text-xs leading-5 text-[#647665]">
            {selectedPlace || "Selected map location"}
          </p>

          <p className="mt-2 break-all font-mono text-xs text-[#586b5a]">
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>

          {accuracy !== null && (
            <p className="mt-2 text-xs text-[#647665]">
              Device-reported accuracy: approximately{" "}
              {Math.round(accuracy)} metres.
            </p>
          )}

          <button
            type="button"
            onClick={removeLocation}
            className="glossy-hover mt-3 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600"
          >
            Remove location
          </button>
        </div>
      )}
    </section>
  );
}
