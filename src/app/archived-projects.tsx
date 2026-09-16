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
  getAllArchivedProjects,
  LocalProject,
} from "../services/projects";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function ArchivedProjectsScreen() {
  const [projects, setProjects] =
    useState<LocalProject[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadArchived() {
        try {
          setIsLoading(true);

          const result =
            await getAllArchivedProjects();

          if (active) {
            setProjects(result);
          }
        } catch (error) {
          console.error(
            "Archived projects error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadArchived();

      return () => {
        active = false;
      };
    }, [])
  );

  function formatCurrency(value: number) {
    return `₱${value.toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    
      edges={["left", "right", "bottom"]}
    >
      <AppHeader
        title="Archived Projects"
        showBack
      />
      

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading archived projects...
          </Text>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="archive-outline"
              size={38}
              color={colors.textMuted}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No archived projects
          </Text>

          <Text style={styles.stateText}>
            Projects you archive will appear
            here and can be restored later.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          <Text style={styles.countText}>
            {projects.length} archived{" "}
            {projects.length === 1
              ? "project"
              : "projects"}
          </Text>

          {projects.map((project) => (
            <Pressable
              key={project.id}
              style={({ pressed }) => [
                styles.projectCard,
                pressed &&
                  styles.cardPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname:
                    "/project-details",
                  params: {
                    id: project.id,
                  },
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name="archive-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>

                <View style={styles.cardText}>
                  <Text
                    style={styles.projectTitle}
                    numberOfLines={2}
                  >
                    {project.title}
                  </Text>

                  <View
                    style={styles.archivedBadge}
                  >
                    <Text
                      style={
                        styles.archivedBadgeText
                      }
                    >
                      Archived
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <View>
                  <Text style={styles.metaLabel}>
                    Budget
                  </Text>
                  <Text style={styles.budgetText}>
                    {formatCurrency(
                      project.budget
                    )}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward-outline"
                  size={21}
                  color={colors.textMuted}
                />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
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
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },



  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },

  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  stateText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },

  list: {
    flex: 1,
  },

  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  countText: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  projectCard: {
    elevation: 3,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  cardPressed: {
    opacity: 0.78,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(107,114,128,0.10)",
  },

  cardText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  projectTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  archivedBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor:
      "rgba(107,114,128,0.12)",
  },

  archivedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.textSecondary,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  metaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  budgetText: {
    marginTop: 2,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },
});
