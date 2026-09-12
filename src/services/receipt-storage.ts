import * as FileSystem from "expo-file-system/legacy";

const RECEIPTS_DIRECTORY_NAME =
  "finance-receipts";

function getReceiptsDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error(
      "DOCUMENT_DIRECTORY_UNAVAILABLE"
    );
  }

  return (
    FileSystem.documentDirectory +
    `${RECEIPTS_DIRECTORY_NAME}/`
  );
}

async function ensureReceiptsDirectory() {
  const directory =
    getReceiptsDirectory();

  const info =
    await FileSystem.getInfoAsync(
      directory
    );

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(
      directory,
      {
        intermediates: true,
      }
    );
  }

  return directory;
}

function getSafeExtension(
  fileName?: string | null,
  uri?: string
) {
  const fileNameMatch =
    fileName?.match(
      /\.([a-zA-Z0-9]+)$/
    );

  const uriMatch =
    uri?.match(
      /\.([a-zA-Z0-9]+)(?:\?|$)/
    );

  const extension = (
    fileNameMatch?.[1] ||
    uriMatch?.[1] ||
    "jpg"
  ).toLowerCase();

  if (
    ![
      "jpg",
      "jpeg",
      "png",
      "webp",
      "heic",
      "heif",
    ].includes(extension)
  ) {
    return "jpg";
  }

  return extension;
}

export async function saveReceiptPhoto({
  sourceUri,
  expenseId,
  fileName,
}: {
  sourceUri: string;
  expenseId: string;
  fileName?: string | null;
}) {
  const directory =
    await ensureReceiptsDirectory();

  const extension =
    getSafeExtension(
      fileName,
      sourceUri
    );

  const destinationUri =
    `${directory}${expenseId}-${Date.now()}.${extension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
}

export async function deleteReceiptPhoto(
  uri: string | null | undefined
) {
  if (!uri) return;

  const receiptsDirectory =
    getReceiptsDirectory();

  // Only remove files created by this app inside
  // its dedicated receipt folder.
  if (
    !uri.startsWith(
      receiptsDirectory
    )
  ) {
    return;
  }

  try {
    await FileSystem.deleteAsync(uri, {
      idempotent: true,
    });
  } catch (error) {
    console.warn(
      "Unable to delete receipt file:",
      error
    );
  }
}
