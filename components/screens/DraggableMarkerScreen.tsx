import { Ionicons } from "@expo/vector-icons";
import {
  Camera,
  MapView,
  PointAnnotation,
} from "@maplibre/maplibre-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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

// Define marker data
const initialMarkers = [
  {
    id: "1",
    coordinate: [46.6753, 24.7136],
    title: "Kingdom Tower",
    description: "Iconic skyscraper in Riyadh",
  },
  {
    id: "2",
    coordinate: [46.7, 24.72],
    title: "Riyadh Gallery Mall",
    description: "Popular shopping destination",
  },
  {
    id: "3",
    coordinate: [46.68, 24.7],
    title: "Al Faisaliyah Center",
    description: "Famous business and shopping center",
  },
  {
    id: "4",
    coordinate: [46.71, 24.735],
    title: "King Khalid International Airport",
    description: "Main airport in Riyadh",
  },
  {
    id: "5",
    coordinate: [46.6773, 24.7136],
    title: "Riyadh City Center",
    description: "Central location in Riyadh",
  },
];

export default function DraggableMarkerScreen() {
  const { styleJson, loading, error } = useSPLMapStyle();
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [draggingMarker, setDraggingMarker] = useState<string | null>(null);
  const [markerCoordinates, setMarkerCoordinates] = useState(initialMarkers);
  const [mapReady, setMapReady] = useState(false); // New state to track map readiness
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  // Show the bottom sheet
  const showBottomSheet = useCallback(() => {
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [bottomSheetAnim]);

  // Hide the bottom sheet
  const hideBottomSheet = useCallback(() => {
    Animated.spring(bottomSheetAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setSelectedMarker(null);
  }, [bottomSheetAnim]);

  // Handle when a marker is selected
  const handleMarkerPress = useCallback(
    (markerId: string) => {
      setSelectedMarker(markerId);
      showBottomSheet();
    },
    [showBottomSheet]
  );

  // Function to handle drag start
  const handleDragStart = useCallback(
    (markerId: string) => {
      setDraggingMarker(markerId);
      hideBottomSheet();
    },
    [hideBottomSheet]
  );

  // Function to handle dragging in progress
  const handleDrag = useCallback(
    (updatedCoordinate: [number, number], markerId: string) => {
      setMarkerCoordinates((prevMarkers) =>
        prevMarkers.map((marker) =>
          marker.id === markerId
            ? { ...marker, coordinate: updatedCoordinate }
            : marker
        )
      );
    },
    []
  );

  // Function to handle drag end and update coordinates
  const handleDragEnd = useCallback(
    (updatedCoordinate: [number, number], markerId: string) => {
      setDraggingMarker(null);
      setMarkerCoordinates((prevMarkers) =>
        prevMarkers.map((marker) =>
          marker.id === markerId
            ? { ...marker, coordinate: updatedCoordinate }
            : marker
        )
      );
    },
    []
  );

  // Reset marker positions to initial state
  const resetMarkerPositions = useCallback(() => {
    setMarkerCoordinates(initialMarkers);
    hideBottomSheet();
  }, [hideBottomSheet]);

  // Handle map load completion
  const handleMapLoad = useCallback(() => {
    setMapReady(true);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={BARIKOI_COLORS.primary} />
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error Loading Map</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const selectedMarkerData = markerCoordinates.find(
    (m) => m.id === selectedMarker
  );

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        attributionEnabled={false}
        zoomEnabled
        compassEnabled
        compassViewPosition={10}
        mapStyle={styleJson}
        onDidFinishLoadingMap={handleMapLoad} // Add map load handler
      >
        <Camera
          centerCoordinate={[46.6773, 24.7136]} // Riyadh center
          zoomLevel={11.5}
          animationDuration={1000}
          animationMode='linearTo'
        />

        {mapReady &&
          markerCoordinates.map((marker) => (
            <PointAnnotation
              key={marker.id}
              id={marker.id}
              coordinate={marker.coordinate}
              draggable={true}
              anchor={{ x: 0.5, y: 1.0 }}
              onDragStart={() => handleDragStart(marker.id)}
              onDrag={(e) => {
                handleDrag(
                  e.geometry.coordinates as [number, number],
                  marker.id
                );
              }}
              onDragEnd={(e) => {
                handleDragEnd(
                  e.geometry.coordinates as [number, number],
                  marker.id
                );
              }}
              onSelected={() => handleMarkerPress(marker.id)}
            >
              <View
                style={[
                  styles.markerContainer,
                  draggingMarker === marker.id && styles.draggingMarker,
                  selectedMarker === marker.id && styles.selectedMarker,
                ]}
              >
                <Image
                  source={require("../../assets/icons/spl-marker.webp")}
                  style={[
                    styles.markerIcon,
                    draggingMarker === marker.id && styles.draggingIcon,
                  ]}
                  resizeMode='contain'
                />
                {draggingMarker === marker.id && (
                  <View style={styles.dragIndicator}>
                    <Ionicons name='move' size={12} color='white' />
                  </View>
                )}
              </View>
            </PointAnnotation>
          ))}
      </MapView>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Tap markers to see details • Long press and drag to move them
        </Text>
      </View>

      {/* Reset Button */}
      <Pressable style={styles.resetButton} onPress={resetMarkerPositions}>
        <Ionicons name='refresh' size={20} color='white' />
        <Text style={styles.resetButtonText}>Reset Positions</Text>
      </Pressable>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [
              {
                translateY: bottomSheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
          },
        ]}
      >
        {selectedMarkerData && (
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.bottomSheetTitle}>
                  {selectedMarkerData.title}
                </Text>
                <Text style={styles.bottomSheetDescription}>
                  {selectedMarkerData.description}
                </Text>
              </View>
              <Pressable onPress={hideBottomSheet} style={styles.closeButton}>
                <Ionicons name='close' size={20} color='#666' />
              </Pressable>
            </View>
            <View style={styles.coordinateContainer}>
              <Text style={styles.coordinateTitle}>Current Position</Text>
              <View style={styles.coordinateGrid}>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Latitude</Text>
                  <Text style={styles.coordinateValue}>
                    {selectedMarkerData.coordinate[1].toFixed(6)}°
                  </Text>
                </View>
                <View style={styles.coordinateItem}>
                  <Text style={styles.coordinateLabel}>Longitude</Text>
                  <Text style={styles.coordinateValue}>
                    {selectedMarkerData.coordinate[0].toFixed(6)}°
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.dragInstructions}>
              <Ionicons
                name='information-circle'
                size={16}
                color={BARIKOI_COLORS.primary}
              />
              <Text style={styles.dragInstructionsText}>
                Long press and drag this marker to move it to a new location
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Barikoi Logo Attribution */}
      <Pressable
        style={styles.logoContainer}
        onPress={() =>
          Linking.openURL("https://na-maps.vng-solutions.com/docs/")
        }
      >
        <BarikoiLogo width={80} height={60} />
      </Pressable>
    </View>
  );
}

// Styles remain unchanged
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
    position: "relative",
  },
  markerIcon: {
    width: 40,
    height: 40,
  },
  selectedMarker: {
    transform: [{ scale: 1.1 }],
  },
  draggingMarker: {
    transform: [{ scale: 1.2 }],
    opacity: 0.8,
  },
  draggingIcon: {
    tintColor: BARIKOI_COLORS.primary,
  },
  dragIndicator: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BARIKOI_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionsContainer: {
    position: "absolute",
    top: Platform.select({ ios: 60, android: 40 }),
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    padding: 12,
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
  instructionsText: {
    fontSize: 14,
    color: BARIKOI_COLORS.text,
    textAlign: "center",
    fontWeight: "500",
  },
  resetButton: {
    position: "absolute",
    top: Platform.select({ ios: 120, android: 100 }),
    right: 16,
    backgroundColor: BARIKOI_COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  resetButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingBottom: Platform.select({ ios: 34, android: 20 }),
  },
  bottomSheetContent: {
    padding: 20,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: BARIKOI_COLORS.text,
    marginBottom: 4,
  },
  bottomSheetDescription: {
    fontSize: 14,
    color: BARIKOI_COLORS.text,
    opacity: 0.7,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: BARIKOI_COLORS.background,
  },
  coordinateContainer: {
    backgroundColor: BARIKOI_COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  coordinateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BARIKOI_COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  coordinateGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  coordinateItem: {
    alignItems: "center",
  },
  coordinateLabel: {
    fontSize: 12,
    color: BARIKOI_COLORS.text,
    opacity: 0.7,
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 16,
    color: BARIKOI_COLORS.primary,
    fontWeight: "600",
  },
  dragInstructions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: BARIKOI_COLORS.primaryLight,
    borderRadius: 8,
  },
  dragInstructionsText: {
    flex: 1,
    fontSize: 12,
    color: BARIKOI_COLORS.text,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginVertical: 8,
  },
  logoContainer: {
    position: "absolute",
    left: 16,
    bottom: Platform.select({ ios: 32, android: 24 }),
    opacity: 0.9,
  },
});
