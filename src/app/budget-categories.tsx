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
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BudgetCategory,
  deleteBudgetCategory,
  getBudgetCategories,
} from "../services/budget-categories";
import {
  getCurrentSessionUser,
} from "../services/session";
import {
  colors,
  spacing,
  typography,
} from "../theme";

export default function BudgetCategoriesScreen() {
  const [categories, setCategories] =
    useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const loadCategories =
    useCallback(async () => {
      try {
        setIsLoading(true);

        const result =
          await getBudgetCategories();

        setCategories(result);
      } catch (error) {
        console.error(
          "Budget categories loading error:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setIsLoading(true);

          const result =
            await getBudgetCategories();

          if (active) {
            setCategories(result);
          }
        } catch (error) {
          console.error(
            "Budget categories loading error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [])
  );

  function confirmDelete(
    category: BudgetCategory
  ) {
    if (deletingId) return;

    Alert.alert(
      "Delete Budget Category",
      `Delete "${category.name}"? Existing allocations or expenses will not be deleted, but they will no longer be linked to this category.`,
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
              setDeletingId(category.id);

              const user =
                await getCurrentSessionUser();

              await deleteBudgetCategory(
                category.id,
                user?.id
              );

              await loadCategories();
            } catch (error) {
              console.error(
                "Delete budget category error:",
                error
              );

              Alert.alert(
                "Unable to Delete",
                "The budget category could not be deleted."
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

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
          Budget Categories
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.screen}>
        <Text style={styles.introTitle}>
          Organize the SK Budget
        </Text>

        <Text style={styles.introText}>
          Categories group budget allocations and
          expenses into clear financial purposes.
        </Text>

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading categories...
            </Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="albums-outline"
                size={38}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No budget categories
            </Text>

            <Text style={styles.stateText}>
              Tap the + button to create your first
              budget category.
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
              {categories.length}{" "}
              {categories.length === 1
                ? "category"
                : "categories"}
            </Text>

            {categories.map((category) => (
              <View
                key={category.id}
                style={styles.categoryCard}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons
                    name="albums-outline"
                    size={22}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.categoryText}>
                  <Text
                    style={styles.categoryName}
                    numberOfLines={2}
                  >
                    {category.name}
                  </Text>

                  {category.description ? (
                    <Text
                      style={
                        styles.categoryDescription
                      }
                      numberOfLines={3}
                    >
                      {category.description}
                    </Text>
                  ) : (
                    <Text
                      style={
                        styles.noDescription
                      }
                    >
                      No description
                    </Text>
                  )}
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                  onPress={() =>
                    confirmDelete(category)
                  }
                  disabled={
                    deletingId === category.id
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
            router.push(
              "/add-budget-category"
            )
          }
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
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  headerSpacer: {
    width: 44,
  },

  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },

  introTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  introText: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
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
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
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

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 100,
  },

  countText: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  categoryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  categoryText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  categoryName: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  categoryDescription: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  noDescription: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  deleteButton: {
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

  buttonPressed: {
    opacity: 0.72,
  },
});
