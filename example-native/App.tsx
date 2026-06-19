/**
 * Minimal React Native usage sample for @gifcommit/golden-grids/native.
 *
 * Standalone Expo snippet — not part of the library build or test run. Drop it
 * into an Expo app (with react-native installed) to see the spiral render with
 * native Views. The component contract mirrors the web GoldenGrid exactly.
 */
import React from "react";
import { Text } from "react-native";
import { GoldenGrid, GoldenBox } from "@gifcommit/golden-grids/native";

export default function App() {
  return (
    <GoldenGrid from={1} to={5} color="#7f7ec7" placement="right">
      <GoldenBox>
        <Text>Largest slot — first child</Text>
      </GoldenBox>
      <GoldenBox>
        <Text>Next slot</Text>
      </GoldenBox>
    </GoldenGrid>
  );
}
