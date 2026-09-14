import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors } from "../theme";

const qrcode = require("qrcode-generator") as typeof import("qrcode-generator");

type ProfileQRCodeProps = {
  value: string;
  size?: number;
};

const QUIET_ZONE = 4;

export function ProfileQRCode({
  value,
  size = 248,
}: ProfileQRCodeProps) {
  const qrGraphic = useMemo(() => {
    try {
      const qr = qrcode(0, "L");
      qr.addData(value, "Byte");
      qr.make();

      const moduleCount = qr.getModuleCount();
      const pathParts: string[] = [];

      for (let row = 0; row < moduleCount; row += 1) {
        for (let column = 0; column < moduleCount; column += 1) {
          if (!qr.isDark(row, column)) {
            continue;
          }

          const x = column + QUIET_ZONE;
          const y = row + QUIET_ZONE;

          pathParts.push(`M${x} ${y}h1v1h-1z`);
        }
      }

      return {
        path: pathParts.join(""),
        viewBoxSize: moduleCount + QUIET_ZONE * 2,
        error: "",
      };
    } catch (error) {
      console.error("Profile QR generation error:", error);

      return {
        path: "",
        viewBoxSize: 0,
        error: "Unable to generate this QR code.",
      };
    }
  }, [value]);

  if (
    qrGraphic.error ||
    !qrGraphic.path ||
    qrGraphic.viewBoxSize <= 0
  ) {
    return (
      <View style={[styles.errorCard, { width: size }]}> 
        <Text style={styles.errorText}>{qrGraphic.error}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.qrCanvas,
        {
          width: size,
          height: size,
        },
      ]}
      accessibilityLabel="SK Local profile QR code"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${qrGraphic.viewBoxSize} ${qrGraphic.viewBoxSize}`}
      >
        <Path d={qrGraphic.path} fill="#000000" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  qrCanvas: {
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.28)",
  },

  errorCard: {
    elevation: 3,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.28)",
  },

  errorText: {
    textAlign: "center",
    color: "#B91C1C",
    fontWeight: "700",
  },
});
