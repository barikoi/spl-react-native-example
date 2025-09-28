import { useEffect, useState } from "react";

/**
 * Fetches Barikoi map style JSON
 * @param apiKey - Your Barikoi API key (optional, uses default if not provided)
 * @returns Promise<any> - Map style JSON object
 */
export const fetchBarikoiMapStyle = async (): Promise<any> => {
  try {
    const response = await fetch(
      `https://na-maps.vng-solutions.com/styles/spl_bgmaps/style.json`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Remove sprite property for React Native compatibility
    if (data.sprite) {
      delete data.sprite;
    }

    return data;
  } catch (error) {
    console.error("Error fetching Barikoi map style:", error);
    throw error;
  }
};

/**
 * Hook for Loading SPL Map style
 * @param apiKey - Optional API key override
 * @returns {styleJson: any, loading: boolean, error: string | null}
 */
export const useBarikoiMapStyle = () => {
  const [styleJson, setStyleJson] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStyle = async () => {
      try {
        setLoading(true);
        setError(null);
        const style = await fetchBarikoiMapStyle();
        setStyleJson(style);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load map style"
        );
        console.error("Map style loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStyle();
  }, []);

  return { styleJson, loading, error };
};

/**
 * Default coordinates for Bangladesh/Dhaka
 */
export const DEFAULT_COORDINATES = {
  RIYADH: [46.6753, 24.7136] as [number, number],
  JEDDAH: [39.19797, 21.4858] as [number, number],
  MAKKAH: [39.8262, 21.3891] as [number, number],
  MADINAH: [39.6142, 24.5247] as [number, number],
  DAMMAM: [50.1018, 26.4207] as [number, number],
};

/**
 * Default camera settings
 */
export const DEFAULT_CAMERA_SETTINGS = {
  centerCoordinate: DEFAULT_COORDINATES.RIYADH,
  zoomLevel: 16,
  animationDuration: 1000,
  animationMode: "linearTo" as const,
};

/**
 * Common map style configurations
 */
export const MAP_STYLES = {
  line: {
    lineColor: "#2e8555",
    lineWidth: 3,
    lineCap: "round" as const,
    lineJoin: "round" as const,
  },
  polygon: {
    fillColor: "rgba(46, 133, 85, 0.5)",
    fillOutlineColor: "#2e8555",
  },
  marker: {
    anchorDefault: { x: 0.5, y: 1.0 },
    iconSize: { width: 40, height: 40 },
  },
};

/**
 * Color theme matching Barikoi brand
 */
export const BARIKOI_COLORS = {
  primary: "#2e8555",
  primaryLight: "rgba(46, 133, 85, 0.5)",
  secondary: "#e74c3c",
  background: "#f5f5f5",
  text: "#333",
  white: "#ffffff",
  warning: "#ffc107",
};

/**
 * Validates if coordinates are within Bangladesh bounds (approximate)
 * @param coordinates - [longitude, latitude]
 * @returns boolean
 */
export const isWithinBangladeshBounds = (
  coordinates: [number, number]
): boolean => {
  const [lng, lat] = coordinates;

  // Approximate Bangladesh bounds
  const bounds = {
    north: 26.8,
    south: 20.3,
    east: 92.8,
    west: 88.0,
  };

  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
};

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param coord1 - [longitude, latitude]
 * @param coord2 - [longitude, latitude]
 * @returns distance in kilometers
 */
export const calculateDistance = (
  coord1: [number, number],
  coord2: [number, number]
): number => {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Creates a circle polygon for given center and radius
 * @param center - [longitude, latitude]
 * @param radiusInKm - radius in kilometers
 * @param points - number of points to create the circle (default: 64)
 * @returns array of coordinates forming a circle
 */
export const createCirclePolygon = (
  center: [number, number],
  radiusInKm: number,
  points: number = 64
): [number, number][] => {
  const coords: [number, number][] = [];
  const [lng, lat] = center;

  for (let i = 0; i < points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const dx = (Math.cos(angle) * radiusInKm) / 111.32;
    const dy =
      (Math.sin(angle) * radiusInKm) /
      (111.32 * Math.cos(lat * (Math.PI / 180)));

    coords.push([lng + dx, lat + dy]);
  }

  // Close the circle
  coords.push(coords[0]);

  return coords;
};
