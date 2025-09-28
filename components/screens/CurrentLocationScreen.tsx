import { Ionicons } from "@expo/vector-icons";
import type { Location } from "@maplibre/maplibre-react-native";
import {
  Camera,
  MapView,
  MarkerView,
  UserLocation,
} from "@maplibre/maplibre-react-native";
import * as ExpoLocation from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BARIKOI_COLORS, useSPLMapStyle } from "../../utils/mapUtils";
import BarikoiLogo from "../BarikoiLogo";

// Helper function to convert Expo location to MapLibre location
const convertLocation = (
  expoLocation: ExpoLocation.LocationObject
): Location => ({
  coords: {
    latitude: expoLocation.coords.latitude,
    longitude: expoLocation.coords.longitude,
    altitude: expoLocation.coords.altitude ?? undefined,
    accuracy: expoLocation.coords.accuracy ?? undefined,
    heading: expoLocation.coords.heading ?? undefined,
    speed: expoLocation.coords.speed ?? undefined,
  },
  timestamp: expoLocation.timestamp,
});

export default function CurrentLocationScreen() {
  const { styleJson, loading: mapLoading, error: mapError } = useSPLMapStyle();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [hasFlownToLocation, setHasFlownToLocation] = useState(false);
  const [followsUserLocation, setFollowsUserLocation] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    // Request location permission and start watching location
    requestLocationPermission();
    let locationSubscription: ExpoLocation.LocationSubscription;

    const startWatchingLocation = async () => {
      locationSubscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 10,
        },
        (location) => {
          setUserLocation(convertLocation(location));
        }
      );
    };

    if (hasLocationPermission) {
      startWatchingLocation();
    }

    // Cleanup subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [hasLocationPermission]);

  // Fly to user location when first location is received or when followsUserLocation is true
  useEffect(() => {
    if (
      userLocation &&
      (followsUserLocation || !hasFlownToLocation) &&
      cameraRef.current
    ) {
      const { latitude, longitude } = userLocation.coords;

      // Smooth animated fly to user location with zoom level 16
      cameraRef.current.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 16,
        animationDuration: 2000, // 2 seconds smooth animation
        animationMode: "flyTo",
      });

      if (!hasFlownToLocation) {
        setHasFlownToLocation(true);
      }
      console.log(`Flying to user location: ${latitude}, ${longitude}`);
    }
  }, [userLocation, hasFlownToLocation, followsUserLocation]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setHasLocationPermission(true);
        const location = await ExpoLocation.getCurrentPositionAsync({});
        setUserLocation(convertLocation(location));
      } else {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for this feature.",
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      console.error("Error requesting location permission:", err);
      Alert.alert("Error", "Failed to request location permission.", [
        { text: "OK" },
      ]);
    } finally {
      setPermissionLoading(false);
    }
  };

  const handleLocationUpdate = (location: Location) => {
    setUserLocation(location);
  };

  const handleLocationPress = () => {
    if (userLocation) {
      const { latitude, longitude } = userLocation.coords;
      Alert.alert(
        "Current Location",
        `Latitude: ${latitude}\nLongitude: ${longitude}`,
        [{ text: "OK" }]
      );
    }
  };

  const toggleFollowsUserLocation = useCallback(() => {
    setFollowsUserLocation((prev) => !prev);
  }, []);

  // Show loading state while map style or permissions are loading
  if (mapLoading || permissionLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={BARIKOI_COLORS.primary} />
        <Text style={styles.loadingText}>
          {permissionLoading
            ? "Requesting Location Permission..."
            : "Loading Map..."}
        </Text>
      </View>
    );
  }

  // Show error state if map style failed to load
  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error Loading Map</Text>
        <Text style={styles.errorText}>{mapError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        attributionEnabled={false}
        zoomEnabled
        compassEnabled
        compassViewPosition={10}
        mapStyle={styleJson}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={[46.6773, 24.7136]} // Default center (Riyadh)
          zoomLevel={10}
          animationDuration={1000}
          animationMode='flyTo'
        />

        {hasLocationPermission && (
          <UserLocation
            visible={true}
            animated={true}
            renderMode='normal'
            showsUserHeadingIndicator={true}
            minDisplacement={10}
            onUpdate={handleLocationUpdate}
            onPress={handleLocationPress}
          />
        )}

        {/* Custom marker at user location */}
        {userLocation && (
          <MarkerView
            coordinate={[
              userLocation.coords.longitude,
              userLocation.coords.latitude,
            ]}
            anchor={{ x: 0.5, y: 1.0 }}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require("../../assets/icons/spl-marker.webp")}
                style={styles.markerIcon}
                resizeMode='contain'
              />
            </View>
          </MarkerView>
        )}
      </MapView>

      {/* Barikoi Logo Attribution */}
      <Pressable
        style={styles.logoContainer}
        onPress={() =>
          Linking.openURL("https://na-maps.vng-solutions.com/docs/")
        }
      >
        <BarikoiLogo width={80} height={60} />
      </Pressable>

      {/* Location Control Button */}
      <View style={styles.controls}>
        <Pressable
          style={styles.controlButton}
          onPress={toggleFollowsUserLocation}
        >
          <Ionicons
            name={followsUserLocation ? "location" : "location-outline"}
            size={24}
            color={BARIKOI_COLORS.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BARIKOI_COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: BARIKOI_COLORS.primary,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BARIKOI_COLORS.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: BARIKOI_COLORS.secondary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: BARIKOI_COLORS.text,
    textAlign: "center",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerIcon: {
    width: 40,
    height: 40,
  },
  controls: {
    position: "absolute",
    right: 16,
    bottom: Platform.select({ ios: 32, android: 24 }),
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  logoContainer: {
    position: "absolute",
    left: 16,
    bottom: Platform.select({ ios: 32, android: 24 }),
    opacity: 0.9,
  },
});
