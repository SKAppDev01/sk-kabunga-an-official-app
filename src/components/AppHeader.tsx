import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, typography } from "../theme";

const SIDE_ZONE_WIDTH = 56;

export type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  accessibilityLabel?: string;
};

export function AppHeader({
  title,
  showBack = false,
  onBackPress,
  left,
  right,
  accessibilityLabel,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const handleBackPress = onBackPress ?? (() => router.back());

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.28 }]}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <Svg width="100%" height="100%" style={styles.gradient}>
          <Defs>
            <SvgLinearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#3F73C8" />
              <Stop offset="52%" stopColor="#1E3A5F" />
              <Stop offset="100%" stopColor="#0B1220" />
            </SvgLinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#headerGradient)" />
        </Svg>

        <View style={styles.decorativeLayer}>
          <View style={styles.orbTopRight} />
          <View style={styles.orbBottomLeft} />
          <View style={styles.ribbon} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={[styles.sideZone, styles.leftZone]}>
          {left ??
            (showBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={handleBackPress}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
              >
                <Ionicons name="arrow-back" size={23} color={colors.white} />
              </Pressable>
            ) : null)}
        </View>

        <View style={styles.titleArea}>
          <Text
            accessibilityRole="header"
            accessibilityLabel={accessibilityLabel ?? title}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.title}
          >
            {title}
          </Text>

          <View pointerEvents="none" style={styles.accentBar}>
            <View style={[styles.accentSegment, styles.accentBlue]} />
            <View style={[styles.accentSegment, styles.accentGold]} />
            <View style={[styles.accentSegment, styles.accentRed]} />
          </View>
        </View>

        <View style={[styles.sideZone, styles.rightZone]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#1E3A5F",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 4,
    zIndex: 20,
  },
  backgroundLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  orbTopRight: {
    position: "absolute",
    width: 132,
    height: 132,
    top: -66,
    right: -34,
    borderRadius: 66,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  orbBottomLeft: {
    position: "absolute",
    width: 94,
    height: 94,
    bottom: -55,
    left: -22,
    borderRadius: 47,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  ribbon: {
    position: "absolute",
    width: 190,
    height: 18,
    right: -36,
    bottom: 12,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.03)",
    transform: [{ rotate: "-14deg" }],
  },
  body: {
    minHeight: 88,
    width: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  sideZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SIDE_ZONE_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  leftZone: {
    left: 0,
  },
  rightZone: {
    right: 0,
  },
  titleArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: SIDE_ZONE_WIDTH,
    right: SIDE_ZONE_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  title: {
    width: "100%",
    textAlign: "center",
    fontSize: typography.fontSize.xl,
    lineHeight: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  accentBar: {
    width: 60,
    height: 3,
    marginTop: 3,
    flexDirection: "row",
    borderRadius: 999,
    overflow: "hidden",
  },
  accentSegment: {
    flex: 1,
  },
  accentBlue: {
    backgroundColor: "#0038A8",
  },
  accentGold: {
    backgroundColor: "#FCD116",
  },
  accentRed: {
    backgroundColor: "#CE1126",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  backButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
