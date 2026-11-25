import { useState, useEffect, useCallback } from "react";
import type { AQIData } from "../types";
import { fetchAQI, fetchAQIByCoords } from "../services/api";

export function useAQI(city?: string) {
  const [data, setData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAQI = useCallback(async (cityName: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAQI(cityName);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AQI");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadByGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await fetchAQIByCoords(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setData(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load AQI");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location access denied. Please enter your city manually.");
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (city) loadAQI(city);
  }, [city, loadAQI]);

  return { data, loading, error, loadAQI, loadByGeolocation };
}
