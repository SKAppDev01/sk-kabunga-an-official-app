import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
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
  getProjectParticipants,
  ProjectParticipant,
  removeProjectParticipant,
} from "../services/project-participants";
import {
  getLocalProjectById,
  LocalProject,
} from "../services/projects";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function ProjectParticipantsScreen() {
  const params = useLocalSearchParams<{
    projectId?: string | string[];
  }>();

  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const [project, setProject] =
    useState<LocalProject | null>(null);
  const [participants, setParticipants] =
    useState<ProjectParticipant[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [removingId, setRemovingId] =
    useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setParticipants([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const [projectResult, participantResult] =
        await Promise.all([
          getLocalProjectById(projectId),
          getProjectParticipants(projectId),
        ]);

      setProject(projectResult);
      setParticipants(participantResult);
    } catch (error) {
      console.error(
        "Project participants loading error:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function confirmRemove(participant: ProjectParticipant) {
    if (removingId) return;

    Alert.alert(
      "Remove Participant",
      `Remove "${participant.participantName}" from this project?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setRemovingId(participant.id);
              const user =
                await getCurrentSessionUser();

              await removeProjectParticipant(
                participant.id,
                user?.id
              );

              await loadData();
            } catch (error) {
              console.error(
                "Remove project participant error:",
                error
              );
              Alert.alert(
                "Unable to Remove",
                "The participant could not be removed."
              );
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
          Project Participants
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading participants...
          </Text>
        </View>
      ) : !project ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>
            Project not found
          </Text>
        </View>
      ) : (
        <View style={styles.screen}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="people-outline"
                size={25}
                color={colors.primary}
              />
            </View>

            <View style={styles.summaryText}>
              <Text style={styles.projectName}>
                {project.title}
              </Text>
              <Text style={styles.summaryCount}>
                {participants.length}{" "}
                {participants.length === 1
                  ? "participant"
                  : "participants"}
              </Text>
            </View>
          </View>

          {participants.length === 0 ? (
            <View style={styles.centerState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="people-outline"
                  size={38}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                No participants yet
              </Text>
              <Text style={styles.stateText}>
                Tap the + button to add the first
                participant to this project.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {participants.map((participant) => (
                <View
                  key={participant.id}
                  style={styles.participantCard}
                >
                  <View style={styles.avatar}>
                    <Ionicons
                      name="person-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.cardText}>
                    <Text
                      style={styles.participantName}
                      numberOfLines={2}
                    >
                      {participant.participantName}
                    </Text>

                    <Text
                      style={styles.participantMeta}
                      numberOfLines={1}
                    >
                      {participant.participantRole ||
                        "Participant"}
                    </Text>

                    {participant.contactNumber ? (
                      <Text
                        style={styles.contactText}
                        numberOfLines={1}
                      >
                        {participant.contactNumber}
                      </Text>
                    ) : null}

                    {participant.notes ? (
                      <Text
                        style={styles.notesText}
                        numberOfLines={2}
                      >
                        {participant.notes}
                      </Text>
                    ) : null}
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() =>
                      confirmRemove(participant)
                    }
                    disabled={
                      removingId === participant.id
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.floatingAddButton,
              pressed &&
                styles.floatingAddButtonPressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/add-project-participant",
                params: { projectId: project.id },
              })
            }
          >
            <Ionicons
              name="add"
              size={31}
              color={colors.white}
            />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: { width: 44 },
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },
  summaryText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  projectName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  summaryCount: {
    marginTop: 3,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
    backgroundColor: "rgba(37,99,235,0.08)",
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  stateText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 100 },
  participantCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.08)",
  },
  cardText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  participantName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  participantMeta: {
    marginTop: 3,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  contactText: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  notesText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  removeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  floatingAddButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  buttonPressed: { opacity: 0.72 },
});
