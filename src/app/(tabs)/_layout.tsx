import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  colors,
  typography,
} from "../../theme";

function NoRippleTabButton(
  props: BottomTabBarButtonProps
) {
  return (
    <Pressable
      {...props}
      android_ripple={null}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          colors.primary,

        tabBarInactiveTintColor:
          colors.textMuted,

        tabBarHideOnKeyboard: true,

        tabBarButton: (props) => (
          <NoRippleTabButton {...props} />
        ),

        tabBarLabelStyle: {
          fontSize:
            typography.fontSize.xs,
          fontWeight:
            typography.fontWeight.medium,
        },

        tabBarStyle: {
          height:
            62 +
            Math.max(
              insets.bottom,
              8
            ),

          paddingTop: 7,

          paddingBottom:
            Math.max(
              insets.bottom,
              8
            ),

          borderTopWidth: 1,

          borderTopColor:
            colors.border,

          backgroundColor:
            colors.white,

          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "home"
                  : "home-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "folder"
                  : "folder-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="finance"
        options={{
          title: "Finance",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "wallet"
                  : "wallet-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="records"
        options={{
          title: "Records",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "documents"
                  : "documents-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "grid"
                  : "grid-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
