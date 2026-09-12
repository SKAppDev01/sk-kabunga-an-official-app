import * as FileSystem from "expo-file-system/legacy";

const DOCUMENTS_DIRECTORY_NAME =
  "sk-documents";

function getDocumentsDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error(
      "DOCUMENT_DIRECTORY_UNAVAILABLE"
    );
  }

  return (
    FileSystem.documentDirectory +
    `${DOCUMENTS_DIRECTORY_NAME}/`
  );
}

async function ensureDocumentsDirectory() {
  const directory =
    getDocumentsDirectory();

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
    "bin"
  ).toLowerCase();

  if (
    ![
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "csv",
      "jpg",
      "jpeg",
      "png",
      "webp",
      "heic",
      "heif",
    ].includes(extension)
  ) {
    return "bin";
  }

  return extension;
}

function sanitizeBaseName(
  fileName?: string | null
) {
  const raw =
    fileName
      ?.replace(/\.[^.]+$/, "")
      .trim() || "attachment";

  const safe = raw
    .replace(
      /[^a-zA-Z0-9._-]+/g,
      "-"
    )
    .replace(/-+/g, "-")
    .replace(
      /^[-._]+|[-._]+$/g,
      ""
    )
    .slice(0, 60);

  return safe || "attachment";
}

export async function saveDocumentAttachment({
  sourceUri,
  documentId,
  fileName,
}: {
  sourceUri: string;
  documentId: string;
  fileName?: string | null;
}) {
  const directory =
    await ensureDocumentsDirectory();

  const extension =
    getSafeExtension(
      fileName,
      sourceUri
    );

  const baseName =
    sanitizeBaseName(
      fileName
    );

  const destinationUri =
    `${directory}${documentId}-${Date.now()}-${baseName}.${extension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
}

export async function deleteDocumentAttachmentFile(
  uri: string | null | undefined
) {
  if (!uri) {
    return;
  }

  const directory =
    getDocumentsDirectory();

  // Never delete arbitrary external files.
  if (
    !uri.startsWith(
      directory
    )
  ) {
    return;
  }

  try {
    await FileSystem.deleteAsync(
      uri,
      {
        idempotent: true,
      }
    );
  } catch (error) {
    console.warn(
      "Unable to delete document attachment:",
      error
    );
  }
}
