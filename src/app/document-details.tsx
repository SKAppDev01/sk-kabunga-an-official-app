import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import RecordAuditMetadata from "../components/RecordAuditMetadata";
import {
  useCallback,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  deleteDocument,
  DocumentRecord,
  DocumentStatus,
  getDocumentById,
} from "../services/documents";
import {
  deleteDocumentAttachmentFile,
} from "../services/document-attachment-storage";
import {
  colors,
  spacing,
  typography,
} from "../theme";

function formatDocumentDate(
  value: string
) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return value;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-PH",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

function getStatusStyle(
  status: DocumentStatus
) {
  switch (status) {
    case "Final":
      return {
        backgroundColor:
          "#ECFDF3",
        textColor: "#047857",
      };

    case "Archived":
      return {
        backgroundColor:
          "#F3F4F6",
        textColor:
          colors.textSecondary,
      };

    default:
      return {
        backgroundColor:
          "#EFF6FF",
        textColor:
          colors.primary,
      };
  }
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon:
    | "reader-outline"
    | "calendar-outline"
    | "document-text-outline"
    | "folder-outline"
    | "attach-outline";
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={styles.detailValue}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function DocumentDetailsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const documentId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [document, setDocument] =
    useState<DocumentRecord | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadDocument() {
        if (!documentId) {
          if (active) {
            setNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        try {
          setIsLoading(true);
          setNotFound(false);

          const record =
            await getDocumentById(
              documentId
            );

          if (!active) {
            return;
          }

          if (!record) {
            setDocument(null);
            setNotFound(true);
            return;
          }

          setDocument(record);
        } catch (error) {
          console.error(
            "Document details loading error:",
            error
          );

          if (active) {
            setDocument(null);
            setNotFound(true);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadDocument();

      return () => {
        active = false;
      };
    }, [documentId])
  );

  const statusStyle =
    document
      ? getStatusStyle(
          document.status
        )
      : null;

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <Text
          style={styles.headerTitle}
        >
          Document Details
        </Text>

        <Pressable
          style={styles.headerAction}
          onPress={() =>
            router.push({
              pathname:
                "/edit-document",
              params: {
                id: documentId,
              },
            })
          }
          disabled={!documentId}
        >
          <Ionicons
            name="create-outline"
            size={23}
            color={colors.primary}
          />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading document...
          </Text>
        </View>
      ) : notFound || !document ? (
        <View style={styles.centerState}>
          <Ionicons
            name="document-text-outline"
            size={44}
            color={colors.textMuted}
          />

          <Text
            style={styles.emptyTitle}
          >
            Document not found
          </Text>

          <Text
            style={styles.stateText}
          >
            This document record may no
            longer be available.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.titleSection}
          >
            <View
              style={styles.titleIcon}
            >
              <Ionicons
                name="document-text-outline"
                size={29}
                color={colors.primary}
              />
            </View>

            <View
              style={styles.titleText}
            >
              <Text
                style={
                  styles.documentTitle
                }
              >
                {document.title}
              </Text>

              {statusStyle ? (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        statusStyle.backgroundColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          statusStyle.textColor,
                      },
                    ]}
                  >
                    {document.status}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View
            style={styles.detailsGroup}
          >
            <DetailRow
              icon="reader-outline"
              label="Document Type"
              value={
                document.documentType
              }
            />

            <DetailRow
              icon="document-text-outline"
              label="Document Number"
              value={
                document.documentNumber ||
                "Not set"
              }
            />

            <DetailRow
              icon="calendar-outline"
              label="Date"
              value={formatDocumentDate(
                document.documentDate
              )}
            />

            <DetailRow
              icon="folder-outline"
              label="Related Project"
              value={
                document.relatedProjectTitle ||
                "None"
              }
            />

            <DetailRow
              icon="attach-outline"
              label="Attachment"
              value={
                document.attachmentUri
                  ? document.attachmentName ||
                    "Attached file"
                  : "Not attached"
              }
            />
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Description
            </Text>

            <Text
              style={
                document.description
                  ? styles.bodyText
                  : styles.emptyText
              }
            >
              {document.description ||
                "No description added."}
            </Text>
          </View>

          {document.attachmentUri ? (
            <View style={styles.section}>
              <Text
                style={styles.sectionTitle}
              >
                Attachment
              </Text>

              <View
                style={styles.attachmentBox}
              >
                <Ionicons
                  name="attach-outline"
                  size={22}
                  color={colors.primary}
                />

                <View
                  style={styles.attachmentText}
                >
                  <Text
                    style={styles.attachmentName}
                    numberOfLines={2}
                  >
                    {document.attachmentName ||
                      "Attached file"}
                  </Text>

                  <Text
                    style={styles.attachmentMeta}
                  >
                    {document.attachmentMimeType ||
                      "Stored locally"}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Pressable
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert(
                  "Delete Document",
                  "Delete this document permanently from this device?",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await deleteDocument(
                            document.id
                          );

                          await deleteDocumentAttachmentFile(
                            document.attachmentUri
                          );

                          router.replace(
                            "/documents"
                          );
                        } catch (error) {
                          console.error(
                            "Delete document error:",
                            error
                          );
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.danger}
              />

              <Text
                style={styles.deleteButtonText}
              >
                Delete Document
              </Text>
            </Pressable>
          </View>
                <RecordAuditMetadata
          table="documents"
          recordId={document.id}
        />
</ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal:
      spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:
      spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize:
      typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  stateText: {
    width: "100%",
    maxWidth: 290,
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom:
      spacing.xxxl,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom:
      spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  titleIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor:
      "#EFF6FF",
  },
  titleText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.lg,
  },
  documentTitle: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  statusBadge: {
    alignSelf: "flex-start",
    minWidth: 74,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingHorizontal:
      spacing.md,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
    textAlign: "center",
  },
  detailsGroup: {
    paddingVertical:
      spacing.md,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },
  detailRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  detailLabel: {
    fontSize:
      typography.fontSize.xs,
    color: colors.textMuted,
  },
  detailValue: {
    marginTop: 3,
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.text,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },
  sectionDescription: {
    marginTop: spacing.xs,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
  },
  bodyText: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color: colors.text,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textMuted,
  },
  attachmentBox: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  attachmentText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  attachmentName: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    lineHeight: 20,
    color: colors.text,
  },
  attachmentMeta: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  deleteButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
  },
  deleteButtonText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.danger,
  },
});
