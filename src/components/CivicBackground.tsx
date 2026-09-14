import {
  Image,
  StyleSheet,
  View,
} from "react-native";

export function CivicBackground() {
  return (
    <View
      pointerEvents="none"
      style={styles.root}
    >
      <Image
        source={require(
          "../../assets/images/civic-background.png"
        )}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    backgroundColor: "#E3F2FD",
  },

  backgroundImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0.12,
  },
});
