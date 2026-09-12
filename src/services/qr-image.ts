import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import {
  createBarcodeScanner,
} from "@t-mrtgu/react-native-vision-camera-barcode-scanner";
import {
  loadImage,
} from "react-native-nitro-image";

function sanitizeFileName(
  value: string
) {
  const cleaned =
    value
      .trim()
      .replace(
        /[^a-zA-Z0-9._-]+/g,
        "-"
      )
      .replace(/-+/g, "-")
      .replace(
        /^[-._]+|[-._]+$/g,
        ""
      )
      .slice(0, 70);

  return cleaned || "QR";
}

function buildQrImageFileName(
  label: string
) {
  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        "-"
      );

  return (
    `${sanitizeFileName(label)}-` +
    `${timestamp}.png`
  );
}

export async function saveQrPngBase64({
  base64,
  label,
}: {
  base64: string;
  label: string;
}) {
  const permission =
    await FileSystem
      .StorageAccessFramework
      .requestDirectoryPermissionsAsync();

  const fileName =
    buildQrImageFileName(
      label
    );

  if (!permission.granted) {
    return {
      saved: false as const,
      fileName,
    };
  }

  const destination =
    await FileSystem
      .StorageAccessFramework
      .createFileAsync(
        permission.directoryUri,
        fileName,
        "image/png"
      );

  await FileSystem
    .writeAsStringAsync(
      destination,
      base64,
      {
        encoding:
          FileSystem
            .EncodingType
            .Base64,
      }
    );

  return {
    saved: true as const,
    fileName,
    uri: destination,
  };
}

export async function shareQrPngBase64({
  base64,
  label,
}: {
  base64: string;
  label: string;
}) {
  const available =
    await Sharing
      .isAvailableAsync();

  if (!available) {
    throw new Error(
      "SHARING_NOT_AVAILABLE"
    );
  }

  if (
    !FileSystem.cacheDirectory
  ) {
    throw new Error(
      "CACHE_DIRECTORY_UNAVAILABLE"
    );
  }

  const fileName =
    buildQrImageFileName(
      label
    );

  const uri =
    FileSystem.cacheDirectory +
    fileName;

  await FileSystem
    .writeAsStringAsync(
      uri,
      base64,
      {
        encoding:
          FileSystem
            .EncodingType
            .Base64,
      }
    );

  try {
    await Sharing.shareAsync(
      uri,
      {
        mimeType: "image/png",
        dialogTitle:
          "Share QR Image",
        UTI: "public.png",
      }
    );
  } finally {
    await FileSystem
      .deleteAsync(
        uri,
        {
          idempotent: true,
        }
      )
      .catch(() => {});
  }
}

export async function pickAndScanQrImage() {
  const pickerResult =
    await ImagePicker
      .launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

  if (
    pickerResult.canceled ||
    !pickerResult.assets?.[0]
  ) {
    return null;
  }

  const asset =
    pickerResult.assets[0];

  let localUri =
    asset.uri;

  let temporaryCopyUri:
    string | null = null;

  /*
    Nitro Image treats the `url` source as a Web Image, even when the
    URL starts with file://. That requires react-native-nitro-web-image.

    For an Android gallery image we want Nitro Image's LOCAL file loader
    instead, so pass `filePath` with a normal filesystem path.
  */
  if (
    !localUri.startsWith(
      "file://"
    )
  ) {
    if (
      !FileSystem.cacheDirectory
    ) {
      throw new Error(
        "CACHE_DIRECTORY_UNAVAILABLE"
      );
    }

    const extension =
      asset.fileName
        ?.split(".")
        .pop()
        ?.replace(
          /[^a-zA-Z0-9]/g,
          ""
        ) || "png";

    temporaryCopyUri =
      FileSystem.cacheDirectory +
      `qr-upload-${Date.now()}.${extension}`;

    await FileSystem.copyAsync({
      from: localUri,
      to: temporaryCopyUri,
    });

    localUri =
      temporaryCopyUri;
  }

  const filePath =
    decodeURIComponent(
      localUri.replace(
        /^file:\/\//,
        ""
      )
    );

  const image =
    await loadImage({
      filePath,
    });

  const scanner =
    createBarcodeScanner({
      barcodeFormats: [
        "qr-code",
      ],
    });

  try {
    const barcodes =
      await scanner
        .scanCodesInImageAsync(
          image
        );

    const first =
      barcodes.find(
        (barcode) =>
          barcode.rawValue
            ?.trim()
      );

    const rawValue =
      first?.rawValue?.trim();

    if (!rawValue) {
      throw new Error(
        "QR_NOT_FOUND_IN_IMAGE"
      );
    }

    return {
      rawValue,
      fileName:
        asset.fileName ||
        "QR image",
      width: asset.width,
      height: asset.height,
    };
  } finally {
    image.dispose();
    scanner.dispose();

    if (temporaryCopyUri) {
      await FileSystem
        .deleteAsync(
          temporaryCopyUri,
          {
            idempotent: true,
          }
        )
        .catch(() => {});
    }
  }
}
