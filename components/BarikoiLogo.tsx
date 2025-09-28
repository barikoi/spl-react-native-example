import React from "react";
import { Image } from "react-native";

interface BarikoiLogoProps {
  width?: number;
  height?: number;
}

const BarikoiLogo: React.FC<BarikoiLogoProps> = ({
  width = 148.5,
  height = 42.1,
}) => {
  return (
    <Image
      source={require("./spl-logo.webp")} // Update the path to your WebP image
      style={[{ width, height }]}
      resizeMode='contain' // Adjusts the image to fit within the dimensions
    />
  );
};

export default BarikoiLogo;
