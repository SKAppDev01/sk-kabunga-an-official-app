import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../components/AppHeader";

import {
  DocumentRecord,
  DocumentStatus,
  DocumentType,
  getDocumentsList,
} from "../services/documents";
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

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function getTypeIcon(
  type: DocumentType
):
  | "reader-outline"
  | "cart-outline"
  | "receipt-outline"
  | "calculator-outline"
  | "document-text-outline" {
  switch (type) {
    case "Resolution":
      return "reader-outline";

    case "Purchase Request":
      return "cart-outline";

    case "Voucher":
      return "receipt-outline";

    case "Liquidation Record":
      return "calculator-outline";

    default:
      return "document-text-outline";
  }
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

export default function DocumentsScreen() {
  const [documents, setDocuments] =
    useState<DocumentRecord[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadDocuments() {
        try {
          setIsLoading(true);

          const records =
            await getDocumentsList();

          if (active) {
            setDocuments(records);
          }
        } catch (error) {
          console.error(
            "Documents list loading error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadDocuments();

      return () => {
        active = false;
      };
    }, [])
  );

  function renderDocument(
    document: DocumentRecord,
    index: number
  ) {
    const statusStyle =
      getStatusStyle(
        document.status
      );

    return (
      <Pressable
        key={document.id}
        style={({ pressed }) => [
          styles.documentRow,
          index <
            documents.length - 1 &&
            styles.rowDivider,
          pressed &&
            styles.documentRowPressed,
        ]}
        onPress={() =>
          router.push({
            pathname:
              "/document-details",
            params: {
              id: document.id,
            },
          })
        }
      >
        <View style={styles.documentIcon}>
          <Ionicons
            name={getTypeIcon(
              document.documentType
            )}
            size={23}
            color={colors.primary}
          />
        </View>

        <View style={styles.documentText}>
          <View style={styles.titleRow}>
            <Text
              style={styles.documentTitle}
              numberOfLines={1}
            >
              {document.title}
            </Text>

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
                numberOfLines={1}
              >
                {document.status}
              </Text>
            </View>
          </View>

          <Text
            style={styles.documentMeta}
            numberOfLines={1}
          >
            {document.documentType}
            {" • "}
            {formatDocumentDate(
              document.documentDate
            )}
          </Text>

          <Text
            style={styles.documentSubtext}
            numberOfLines={1}
          >
            {document.documentNumber
              ? `No. ${document.documentNumber}`
              : "Document number not set"}
            {document.relatedProjectTitle
              ? ` • ${document.relatedProjectTitle}`
              : ""}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Documents"
        showBack
        right={
          !isLoading ? (
            <View style={styles.headerCountBadge}>
              <Text style={styles.headerCountText}>{documents.length}</Text>
            </View>
          ) : null
        }
      />
      

      <View style={styles.screen}>
        <ScrollView
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { flexGrow: 1 },
          ]}
          showsVerticalScrollIndicator={false}
        >
        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading documents...
            </Text>
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="documents-outline"
                size={44}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No documents yet
            </Text>

            <Text style={styles.stateText}>
              Resolutions, purchase
              requests, vouchers,
              liquidation records and
              other SK documents will
              appear here.
            </Text>
          </View>
        ) : (
          <>
            {documents.map(
              renderDocument
            )}
          </>
        )}

        
      
        </ScrollView>

<Pressable
          style={({ pressed }) => [
            styles.floatingAddButton,
            pressed &&
              styles.floatingAddButtonPressed,
          ]}
          onPress={() =>
            router.push(
              "/add-document"
            )
          }
          accessibilityLabel="Add document"
        >
          <Ionicons
            name="add"
            size={31}
            color={colors.white}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },

  header: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 4,
    zIndex: 20,
  },

  backButton: {
    width: 78,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },


  headerCountWrap: {
    width: 78,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  headerCountBadge: {
    minWidth: 30,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.white,
  },

  headerCountText: {
    fontSize: 11,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  screen: {
    backgroundColor: "#E3F2FD",
    flex: 1,
    paddingHorizontal:
      spacing.xl,
    paddingTop: 0,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:
      spacing.xl,
    paddingBottom:
      spacing.xxxl,
  },

  emptyIcon: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop:
      spacing.md,
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
    paddingHorizontal:
      spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 21,
    color:
      colors.textSecondary,
    textAlign: "center",
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 100,
  },

  floatingAddButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  floatingAddButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  documentRow: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical:
      spacing.md,
  },

  documentRowPressed: {
    opacity: 0.65,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  documentIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  documentText: {
    flex: 1,
    minWidth: 0,
    marginLeft:
      spacing.md,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  documentTitle: {
    flex: 1,
    minWidth: 0,
    paddingRight:
      spacing.sm,
    fontSize:
      typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  statusBadge: {
    minWidth: 68,
    minHeight: 26,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:
      spacing.sm,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 10,
    fontWeight:
      typography.fontWeight.semibold,
    textAlign: "center",
  },

  documentMeta: {
    marginTop: 5,
    fontSize:
      typography.fontSize.xs,
    color:
      colors.textSecondary,
  },

  documentSubtext: {
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    color: colors.textMuted,
  },
});
