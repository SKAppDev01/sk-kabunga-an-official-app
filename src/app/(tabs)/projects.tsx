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

import { AppHeader } from "../../components/AppHeader";

import { CivicBackground } from "../../components/CivicBackground";


import {
  getAllArchivedProjects,
  getAllLocalProjects,
  LocalProject,
} from "../../services/projects";
import {
  getCurrentSessionUser,
  SessionUser,
} from "../../services/session";
import { isYouthMemberRole } from "../../services/access";
import {
  colors,
  spacing,
  typography,
} from "../../theme";

export default function ProjectsScreen() {
  const [currentUser, setCurrentUser] =
    useState<SessionUser | null>(null);
  const [projects, setProjects] =
    useState<LocalProject[]>([]);
  const [archivedCount, setArchivedCount] =
    useState(0);
  const [isLoading, setIsLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProjects() {
        try {
          setIsLoading(true);

          const user =
            await getCurrentSessionUser();

          if (!user) {
            router.replace("/login");
            return;
          }

          const youthMember =
            isYouthMemberRole(user.role);

          const activeProjects =
            await getAllLocalProjects();

          const archivedProjects = youthMember
            ? []
            : await getAllArchivedProjects();

          if (active) {
            setCurrentUser(user);
            setProjects(activeProjects);
            setArchivedCount(
              archivedProjects.length
            );
          }
        } catch (error) {
          console.error(
            "Projects loading error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadProjects();

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

  const youthMember =
    isYouthMemberRole(currentUser?.role);
  const canManage =
    Boolean(currentUser) && !youthMember;

  return (
    <View style={styles.background}>
      <CivicBackground />

      <SafeAreaView
        style={styles.safeArea}
      edges={["left", "right", "bottom"]}
      >
        <AppHeader
          title="Projects"
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

        {canManage && (
        <Pressable
          style={({ pressed }) => [
            styles.archivedLink,
            pressed && styles.buttonPressed,
          ]}
          onPress={() =>
            router.push("/archived-projects")
          }
        >
          <View style={styles.archivedLinkLeft}>
            <Ionicons
              name="archive-outline"
              size={19}
              color={colors.textSecondary}
            />

            <Text style={styles.archivedLinkText}>
              Archived Projects
            </Text>
          </View>

          <View style={styles.archivedLinkRight}>
            <Text style={styles.archivedCount}>
              {archivedCount}
            </Text>

            <Ionicons
              name="chevron-forward-outline"
              size={18}
              color={colors.textMuted}
            />
          </View>
        </Pressable>
        )}

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading projects...
            </Text>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="folder-open-outline"
                size={38}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No active projects
            </Text>

            <Text style={styles.stateText}>
              {youthMember
                ? "No projects are currently available to youth members."
                : "Tap the + button to create a new SK project."}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.countText}>
                {projects.length}{" "}
                {projects.length === 1
                  ? "project"
                  : "projects"}
              </Text>
            </View>

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
                <View
                  style={
                    styles.projectCardHeader
                  }
                >
                  <View
                    style={
                      styles.projectIcon
                    }
                  >
                    <Ionicons
                      name="folder-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={
                      styles.projectHeaderText
                    }
                  >
                    <Text
                      style={
                        styles.projectTitle
                      }
                      numberOfLines={2}
                    >
                      {project.title}
                    </Text>

                    <View
                      style={
                        styles.statusBadge
                      }
                    >
                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {project.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {!youthMember && project.isYouthVisible ? (
                  <View style={styles.visibilityRow}>
                    <Ionicons
                      name="eye-outline"
                      size={14}
                      color={colors.success}
                    />
                    <Text style={styles.visibilityText}>
                      Visible to youth members
                    </Text>
                  </View>
                ) : null}

                {project.description ? (
                  <Text
                    style={
                      styles.description
                    }
                    numberOfLines={3}
                  >
                    {project.description}
                  </Text>
                ) : null}

                <View
                  style={styles.projectFooter}
                >
                  <View>
                    <Text
                      style={
                        styles.metaLabel
                      }
                    >
                      Budget
                    </Text>

                    <Text
                      style={
                        styles.budgetText
                      }
                    >
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
          </>
        )}

        </ScrollView>

        {canManage && (
<Pressable
          style={({ pressed }) => [
            styles.floatingAddButton,
            pressed &&
              styles.floatingAddButtonPressed,
          ]}
          onPress={() =>
            router.push("/new-project")
          }
        >
          <Ionicons
            name="add"
            size={31}
            color={colors.white}
          />
        </Pressable>
        )}
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },

  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },

  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
  },

  header: {
    marginBottom: spacing.lg,
  },

  headerText: {
    width: "100%",
  },

  title: {
    width: "100%",
    minWidth: 0,
    fontSize:
      typography.fontSize.xxl,
    lineHeight: 36,
    fontWeight:
      typography.fontWeight.bold,
    color: "#0038A8",
    flexShrink: 1,
  },

  flagAccent: {
    width: 104,
    height: 4,
    flexDirection: "row",
    overflow: "hidden",
    marginTop: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
  },

  flagAccentSection: {
    height: "100%",
  },

  flagAccentBlue: {
    flex: 5,
    backgroundColor: "#0038A8",
  },

  flagAccentGold: {
    flex: 1,
    backgroundColor: "#FCD116",
  },

  flagAccentRed: {
    flex: 5,
    backgroundColor: "#CE1126",
  },

  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  archivedLink: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  archivedLinkLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  archivedLinkText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
  },

  archivedLinkRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  archivedCount: {
    marginRight: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: 70,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
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

  buttonPressed: {
    opacity: 0.75,
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingTop: spacing.xl,
    paddingBottom: 112,
  },

  listHeader: {
    marginBottom: spacing.md,
  },

  countText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  floatingAddButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: 70 + spacing.md,
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
    transform: [{ scale: 0.96 }],
  },

  projectCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 5,
  },

  cardPressed: {
    opacity: 0.78,
  },

  projectCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  projectIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  projectHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  projectTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  description: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },

  visibilityText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },

  projectFooter: {
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
