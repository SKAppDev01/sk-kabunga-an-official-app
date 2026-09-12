import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getYouthList,
  YouthRecord,
} from "../services/youth";
import {
  colors,
  spacing,
  typography,
} from "../theme";

type AgeFilter =
  | "all"
  | "15-17"
  | "18-24"
  | "25-30"
  | "unknown";

const AGE_FILTERS: Array<{
  key: AgeFilter;
  label: string;
}> = [
  { key: "all", label: "All ages" },
  { key: "15-17", label: "15–17" },
  { key: "18-24", label: "18–24" },
  { key: "25-30", label: "25–30" },
  { key: "unknown", label: "Age not set" },
];

export default function YouthRegistryScreen() {
  const [youth, setYouth] =
    useState<YouthRecord[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [ageFilter, setAgeFilter] =
    useState<AgeFilter>("all");

  const [
    purokFilter,
    setPurokFilter,
  ] = useState("all");

  const [
    filtersExpanded,
    setFiltersExpanded,
  ] = useState(false);

  const purokOptions = useMemo(() => {
    const values = new Set<string>();

    youth.forEach((record) => {
      const value =
        record.purokSitio?.trim();

      if (value) {
        values.add(value);
      }
    });

    return Array.from(values).sort(
      (a, b) =>
        a.localeCompare(
          b,
          "en",
          {
            numeric: true,
            sensitivity: "base",
          }
        )
    );
  }, [youth]);

  const filteredYouth = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return youth.filter((record) => {
      const matchesSearch =
        !query ||
        [
          record.fullName,
          record.purokSitio,
          record.contactNumber,
        ].some(
          (value) =>
            value
              ?.toLowerCase()
              .includes(query)
        );

      if (!matchesSearch) {
        return false;
      }

      const age = record.age;

      const matchesAge =
        ageFilter === "all"
          ? true
          : ageFilter === "unknown"
            ? age === null
            : ageFilter === "15-17"
              ? age !== null &&
                age >= 15 &&
                age <= 17
              : ageFilter === "18-24"
                ? age !== null &&
                  age >= 18 &&
                  age <= 24
                : age !== null &&
                  age >= 25 &&
                  age <= 30;

      if (!matchesAge) {
        return false;
      }

      const matchesPurok =
        purokFilter === "all"
          ? true
          : purokFilter ===
              "__not_set__"
            ? !record.purokSitio?.trim()
            : record.purokSitio?.trim() ===
              purokFilter;

      return matchesPurok;
    });
  }, [
    ageFilter,
    purokFilter,
    searchQuery,
    youth,
  ]);

  const hasActiveFilters =
    ageFilter !== "all" ||
    purokFilter !== "all";

  const activeFilterCount =
    (ageFilter !== "all" ? 1 : 0) +
    (purokFilter !== "all" ? 1 : 0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadYouth() {
        try {
          setIsLoading(true);

          const result =
            await getYouthList();

          if (active) {
            setYouth(result);
          }
        } catch (error) {
          console.error(
            "Youth list loading error:",
            error
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      loadYouth();

      return () => {
        active = false;
      };
    }, [])
  );

  function getSecondaryText(
    record: YouthRecord
  ) {
    const parts: string[] = [];

    if (record.age !== null) {
      parts.push(
        `${record.age} ${
          record.age === 1
            ? "year"
            : "years"
        } old`
      );
    }

    if (record.sex) {
      parts.push(record.sex);
    }

    return parts.length > 0
      ? parts.join(" • ")
      : "Age and sex not set";
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
          Youth Registry
        </Text>

        <View style={styles.headerCountWrap}>
          {!isLoading ? (
            <Pressable
              style={({ pressed }) => [
                styles.headerCountBadge,
                pressed &&
                  styles.headerCountBadgePressed,
              ]}
              onPress={() =>
                router.push(
                  "/youth-statistics"
                )
              }
              accessibilityLabel="Open youth statistics"
            >
              <Text style={styles.headerCountText}>
                {filteredYouth.length}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.screen}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textMuted}
          />

          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search name, Purok/Sitio, or contact"
            placeholderTextColor={
              colors.textMuted
            }
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="never"
          />

          {searchQuery.length > 0 ? (
            <Pressable
              style={styles.clearSearchButton}
              onPress={() =>
                setSearchQuery("")
              }
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}

          <View
            style={styles.searchActionDivider}
          />

          <Pressable
            style={({ pressed }) => [
              styles.inlineFilterButton,
              hasActiveFilters &&
                styles.inlineFilterButtonActive,
              pressed &&
                styles.inlineFilterButtonPressed,
            ]}
            onPress={() =>
              setFiltersExpanded(
                (current) => !current
              )
            }
            accessibilityLabel={
              filtersExpanded
                ? "Hide filters"
                : "Show filters"
            }
          >
            <Ionicons
              name="options-outline"
              size={21}
              color={
                hasActiveFilters
                  ? colors.primary
                  : colors.textSecondary
              }
            />

            {activeFilterCount > 0 ? (
              <View
                style={
                  styles.inlineFilterBadge
                }
              >
                <Text
                  style={
                    styles.inlineFilterBadgeText
                  }
                >
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.filtersSection}>
          {filtersExpanded ? (
            <View
              style={styles.filtersExpanded}
            >
              <View
                style={styles.filterHeader}
              >
                <Text
                  style={styles.filterHelpText}
                >
                  Filter youth records
                </Text>

                {hasActiveFilters ? (
                  <Pressable
                    onPress={() => {
                      setAgeFilter("all");
                      setPurokFilter("all");
                    }}
                    hitSlop={8}
                  >
                    <Text
                      style={
                        styles.clearFiltersText
                      }
                    >
                      Clear
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.filterLabel}>
                Age
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterChipsRow
                }
              >
                {AGE_FILTERS.map(
                  (option) => {
                    const selected =
                      ageFilter ===
                      option.key;

                    return (
                      <Pressable
                        key={option.key}
                        style={[
                          styles.filterChip,
                          selected &&
                            styles.filterChipSelected,
                        ]}
                        onPress={() =>
                          setAgeFilter(
                            option.key
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selected &&
                              styles.filterChipTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>

              <Text style={styles.filterLabel}>
                Purok / Sitio
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterChipsRow
                }
              >
                <Pressable
                  style={[
                    styles.filterChip,
                    purokFilter === "all" &&
                      styles.filterChipSelected,
                  ]}
                  onPress={() =>
                    setPurokFilter("all")
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      purokFilter === "all" &&
                        styles.filterChipTextSelected,
                    ]}
                  >
                    All
                  </Text>
                </Pressable>

                {purokOptions.map(
                  (purok) => {
                    const selected =
                      purokFilter === purok;

                    return (
                      <Pressable
                        key={purok}
                        style={[
                          styles.filterChip,
                          selected &&
                            styles.filterChipSelected,
                        ]}
                        onPress={() =>
                          setPurokFilter(
                            purok
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selected &&
                              styles.filterChipTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {purok}
                        </Text>
                      </Pressable>
                    );
                  }
                )}

                <Pressable
                  style={[
                    styles.filterChip,
                    purokFilter ===
                      "__not_set__" &&
                      styles.filterChipSelected,
                  ]}
                  onPress={() =>
                    setPurokFilter(
                      "__not_set__"
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      purokFilter ===
                        "__not_set__" &&
                        styles.filterChipTextSelected,
                    ]}
                  >
                    Not set
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          ) : null}
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Loading youth records...
            </Text>
          </View>
        ) : youth.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={38}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No youth records yet
            </Text>

            <Text style={styles.stateText}>
              Add a youth record to start building the
              local Youth Registry.
            </Text>
          </View>
        ) : filteredYouth.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="search-outline"
                size={38}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No matching youth
            </Text>

            <Text style={styles.stateText}>
              Try changing the search text or
              clearing one of the filters.
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
            {filteredYouth.map(
              (record, index) => (
              <Pressable
                key={record.id}
                style={({ pressed }) => [
                  styles.youthRow,
                  index <
                    filteredYouth.length - 1 &&
                    styles.rowDivider,
                  pressed &&
                    styles.youthRowPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/youth-profile",
                    params: {
                      id: record.id,
                    },
                  })
                }
              >
                <View style={styles.personIcon}>
                  <Ionicons
                    name="person-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.youthText}>
                  <Text
                    style={styles.youthName}
                    numberOfLines={1}
                  >
                    {record.fullName}
                  </Text>

                  <Text
                    style={styles.youthMeta}
                    numberOfLines={1}
                  >
                    {getSecondaryText(record)}
                  </Text>

                  <Text
                    style={styles.youthLocation}
                    numberOfLines={1}
                  >
                    {record.purokSitio ||
                      "Purok/Sitio not set"}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            )
            )}
          </ScrollView>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.floatingAddButton,
            pressed &&
              styles.floatingAddButtonPressed,
          ]}
          onPress={() =>
            router.push("/add-youth")
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
    width: 78,
    height: 44,
    alignItems: "flex-start",
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

  headerCountWrap: {
    width: 78,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  headerCountBadge: {
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },

  headerCountText: {
    fontSize: 11,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  headerCountBadgePressed: {
    opacity: 0.65,
  },

  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },

  searchContainer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  searchInput: {
    flex: 1,
    minHeight: 48,
    marginLeft: spacing.sm,
    paddingVertical: 0,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  clearSearchButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  searchActionDivider: {
    width: 1,
    height: 24,
    marginLeft: spacing.xs,
    backgroundColor: colors.border,
  },

  inlineFilterButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
    borderRadius: 12,
  },

  inlineFilterButtonActive: {
    backgroundColor: "#EFF6FF",
  },

  inlineFilterButtonPressed: {
    opacity: 0.65,
  },

  inlineFilterBadge: {
    position: "absolute",
    top: 3,
    right: 2,
    minWidth: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  inlineFilterBadgeText: {
    fontSize: 9,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.white,
  },

  filtersSection: {
    marginBottom: spacing.md,
  },

  filtersExpanded: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  filterHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  filterHelpText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  clearFiltersText: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  filterLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.textMuted,
  },

  filterChipsRow: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },

  filterChip: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.white,
  },

  filterChipSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },

  filterChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight:
      typography.fontWeight.medium,
    color: colors.textSecondary,
  },

  filterChipTextSelected: {
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.primary,
  },

  listTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  listSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
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

  youthRow: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  youthRowPressed: {
    opacity: 0.65,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  personIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  youthText: {
    flex: 1,
    marginLeft: spacing.md,
  },

  youthName: {
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.semibold,
    color: colors.text,
  },

  youthMeta: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  youthLocation: {
    marginTop: 3,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
});
