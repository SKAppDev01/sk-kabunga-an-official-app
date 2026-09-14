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
  getProjectExpenseTotal,
} from "../services/project-expenses";
import {
  getProjectParticipantCount,
} from "../services/project-participants";
import {
  archiveLocalProject,
  deleteLocalProject,
  getLocalProjectById,
  LocalProject,
  restoreLocalProject,
} from "../services/projects";
import {
  getCurrentSessionUser,
  SessionUser,
} from "../services/session";
import { isYouthMemberRole } from "../services/access";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function ProjectDetailsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const projectId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [currentUser, setCurrentUser] =
    useState<SessionUser | null>(null);
  const [project, setProject] =
    useState<LocalProject | null>(null);
  const [expenseTotal, setExpenseTotal] =
    useState(0);
  const [participantCount, setParticipantCount] =
    useState(0);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isWorking, setIsWorking] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProject() {
        if (!projectId) {
          if (active) {
            setProject(null);
            setExpenseTotal(0);
            setParticipantCount(0);
            setIsLoading(false);
          }
          return;
        }

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

          const result =
            await getLocalProjectById(projectId);

          const [total, count] = youthMember
            ? [0, 0]
            : await Promise.all([
                getProjectExpenseTotal(projectId),
                getProjectParticipantCount(projectId),
              ]);

          if (active) {
            setCurrentUser(user);
            setProject(result);
            setExpenseTotal(total);
            setParticipantCount(count);
          }
        } catch (error) {
          console.error(
            "Project details error:",
            error
          );

          if (active) {
            setProject(null);
            setExpenseTotal(0);
            setParticipantCount(0);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadProject();

      return () => {
        active = false;
      };
    }, [projectId])
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

  function formatDate(
    value: string | null
  ) {
    if (!value) return "Not set";

    const normalized =
      value.includes("T")
        ? value
        : `${value}T00:00:00`;

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }

  function confirmArchive() {
    if (!project || isWorking) return;

    Alert.alert(
      "Archive Project",
      `Archive "${project.title}"? It will be removed from the active Projects list but can be restored later.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Archive",
          onPress: async () => {
            try {
              setIsWorking(true);
              await archiveLocalProject(
                project.id
              );
              router.back();
            } catch (error) {
              console.error(
                "Archive project error:",
                error
              );
              Alert.alert(
                "Unable to Archive",
                "The project could not be archived."
              );
            } finally {
              setIsWorking(false);
            }
          },
        },
      ]
    );
  }

  function confirmRestore() {
    if (!project || isWorking) return;

    Alert.alert(
      "Restore Project",
      `Restore "${project.title}" to the active Projects list?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Restore",
          onPress: async () => {
            try {
              setIsWorking(true);
              await restoreLocalProject(
                project.id
              );
              router.back();
            } catch (error) {
              console.error(
                "Restore project error:",
                error
              );
              Alert.alert(
                "Unable to Restore",
                "The project could not be restored."
              );
            } finally {
              setIsWorking(false);
            }
          },
        },
      ]
    );
  }

  function confirmDelete() {
    if (!project || isWorking) return;

    Alert.alert(
      "Delete Project",
      `Permanently delete "${project.title}"? This action cannot be undone.`,
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
              setIsWorking(true);
              await deleteLocalProject(
                project.id
              );
              router.back();
            } catch (error) {
              console.error(
                "Delete project error:",
                error
              );
              Alert.alert(
                "Unable to Delete",
                "The project could not be deleted."
              );
            } finally {
              setIsWorking(false);
            }
          },
        },
      ]
    );
  }

  const youthMember =
    isYouthMemberRole(currentUser?.role);

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Project Details
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading project...
          </Text>
        </View>
      ) : !project ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>
            Project not found
          </Text>

          <Text style={styles.stateText}>
            This project may no longer exist.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <Ionicons
                  name="folder-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>

              {!youthMember && !project.isArchived && (
                <Pressable
                  style={({ pressed }) => [
                    styles.editButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname:
                        "/edit-project",
                      params: {
                        id: project.id,
                      },
                    })
                  }
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.primary}
                  />

                  <Text
                    style={
                      styles.editButtonText
                    }
                  >
                    Edit
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.statusBadge}>
                <Text
                  style={styles.statusText}
                >
                  {project.status}
                </Text>
              </View>

              {project.isArchived && (
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
              )}
            </View>

            <Text style={styles.projectTitle}>
              {project.title}
            </Text>
          </View>

          {youthMember && (
            <View style={styles.readOnlyNotice}>
              <Ionicons
                name="eye-outline"
                size={19}
                color={colors.primary}
              />
              <Text style={styles.readOnlyText}>
                Read-only project information available to SK Youth Members.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>
            Project Information
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="wallet-outline"
              label="Planned Budget"
              value={formatCurrency(
                project.budget
              )}
            />

            <View style={styles.divider} />

            <InfoRow
              icon="calendar-outline"
              label="Start Date"
              value={formatDate(
                project.startDate
              )}
            />

            <View style={styles.divider} />

            <InfoRow
              icon="calendar-clear-outline"
              label="End Date"
              value={formatDate(
                project.endDate
              )}
            />
          </View>

          {!youthMember && (
            <>
          <Text style={styles.sectionTitle}>
            Project Expenses
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.expenseCard,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() =>
              router.push({
                pathname:
                  "/project-expenses",
                params: {
                  projectId: project.id,
                },
              })
            }
          >
            <View style={styles.expenseIcon}>
              <Ionicons
                name="receipt-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.expenseText}>
              <Text style={styles.expenseLabel}>
                Total Expenses
              </Text>

              <Text style={styles.expenseValue}>
                {formatCurrency(
                  expenseTotal
                )}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward-outline"
              size={21}
              color={colors.textMuted}
            />
          </Pressable>


          <Text style={styles.sectionTitle}>
            Project Participants
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.participantCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/project-participants",
                params: { projectId: project.id },
              })
            }
          >
            <View style={styles.participantIcon}>
              <Ionicons name="people-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.participantText}>
              <Text style={styles.participantLabel}>Participants</Text>
              <Text style={styles.participantValue}>
                {participantCount} {participantCount === 1 ? "participant" : "participants"}
              </Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={21} color={colors.textMuted} />
          </Pressable>

            </>
          )}

          <Text style={styles.sectionTitle}>
            Description
          </Text>

          <View
            style={styles.descriptionCard}
          >
            <Text
              style={
                project.description
                  ? styles.descriptionText
                  : styles.emptyDescription
              }
            >
              {project.description ||
                "No description added."}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Record Information
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="time-outline"
              label="Created"
              value={formatDate(
                project.createdAt
              )}
            />

            {project.isArchived && (
              <>
                <View
                  style={styles.divider}
                />

                <InfoRow
                  icon="archive-outline"
                  label="Archived"
                  value={formatDate(
                    project.archivedAt
                  )}
                />
              </>
            )}
          </View>

          {!youthMember && (
            <>
          <Text style={styles.sectionTitle}>
            Project Actions
          </Text>

          <View style={styles.actionsCard}>
            {project.isArchived ? (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={confirmRestore}
                disabled={isWorking}
              >
                <Ionicons
                  name="refresh-outline"
                  size={21}
                  color={colors.primary}
                />

                <View
                  style={styles.actionText}
                >
                  <Text
                    style={
                      styles.actionTitle
                    }
                  >
                    Restore Project
                  </Text>
                  <Text
                    style={
                      styles.actionSubtitle
                    }
                  >
                    Return this project to the
                    active list.
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={confirmArchive}
                disabled={isWorking}
              >
                <Ionicons
                  name="archive-outline"
                  size={21}
                  color={colors.primary}
                />

                <View
                  style={styles.actionText}
                >
                  <Text
                    style={
                      styles.actionTitle
                    }
                  >
                    Archive Project
                  </Text>
                  <Text
                    style={
                      styles.actionSubtitle
                    }
                  >
                    Hide it from active projects
                    without deleting it.
                  </Text>
                </View>
              </Pressable>
            )}

            <View
              style={styles.actionDivider}
            />

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={confirmDelete}
              disabled={isWorking}
            >
              <Ionicons
                name="trash-outline"
                size={21}
                color={colors.danger}
              />

              <View
                style={styles.actionText}
              >
                <Text
                  style={
                    styles.deleteActionTitle
                  }
                >
                  Delete Project
                </Text>
                <Text
                  style={
                    styles.actionSubtitle
                  }
                >
                  Permanently remove this project.
                </Text>
              </View>
            </Pressable>
          </View>
            </>
          )}
                {!youthMember ? (
          <RecordAuditMetadata
            table="projects"
            recordId={project.id}
          />
        ) : null}
</ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon:
    | "wallet-outline"
    | "calendar-outline"
    | "calendar-clear-outline"
    | "time-outline"
    | "archive-outline";
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E3F2FD",
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  headerSpacer: { width: 44 },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  stateText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },

  scrollView: {
    backgroundColor: "#E3F2FD", flex: 1 },

  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  heroCard: {
    elevation: 3,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  editButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
  },

  editButtonText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },

  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  archivedBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor:
      "rgba(107,114,128,0.12)",
  },

  archivedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.textSecondary,
  },

  projectTitle: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.xl,
    lineHeight: 31,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  readOnlyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  readOnlyText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  infoCard: {
    elevation: 3,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  infoRow: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  infoText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  infoValue: {
    marginTop: 3,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  divider: {
    height: 1,
    marginLeft: 54,
    backgroundColor: colors.border,
  },

  expenseCard: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 78,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  expenseText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  expenseLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  expenseValue: {
    marginTop: 3,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },


  participantCard: {
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 78,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  participantIcon: {
    width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },
  participantText: { flex: 1, marginLeft: spacing.md },
  participantLabel: { fontSize: typography.fontSize.xs, color: colors.textMuted },
  participantValue: {
    marginTop: 3, fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold, color: colors.text,
  },

  descriptionCard: {
    elevation: 3,
    minHeight: 110,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  descriptionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  emptyDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    color: colors.textMuted,
  },

  actionsCard: {
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
    overflow: "hidden",
  },

  actionButton: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  actionText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  actionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  deleteActionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.danger,
  },

  actionSubtitle: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  actionDivider: {
    height: 1,
    marginLeft: 54,
    backgroundColor: colors.border,
  },

  buttonPressed: {
    opacity: 0.72,
  },
});
