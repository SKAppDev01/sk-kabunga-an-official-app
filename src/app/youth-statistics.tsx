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

type CountItem = {
  label: string;
  count: number;
};

function percentage(
  count: number,
  total: number
) {
  if (total <= 0) {
    return 0;
  }

  return Math.round(
    (count / total) * 100
  );
}

function normalizeLabel(
  value: string | null
) {
  const clean = value?.trim();

  return clean || "Not set";
}

function groupValues(
  records: YouthRecord[],
  getValue: (
    record: YouthRecord
  ) => string | null
): CountItem[] {
  const counts = new Map<
    string,
    number
  >();

  records.forEach((record) => {
    const label = normalizeLabel(
      getValue(record)
    );

    counts.set(
      label,
      (counts.get(label) || 0) + 1
    );
  });

  return Array.from(
    counts.entries()
  )
    .map(([label, count]) => ({
      label,
      count,
    }))
    .sort((a, b) => {
      if (a.label === "Not set") {
        return 1;
      }

      if (b.label === "Not set") {
        return -1;
      }

      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.label.localeCompare(
        b.label,
        "en",
        {
          numeric: true,
          sensitivity: "base",
        }
      );
    });
}

export default function YouthStatisticsScreen() {
  const [youth, setYouth] =
    useState<YouthRecord[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadYouth() {
        try {
          setIsLoading(true);

          const records =
            await getYouthList();

          if (active) {
            setYouth(records);
          }
        } catch (error) {
          console.error(
            "Youth statistics loading error:",
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

  const statistics = useMemo(() => {
    const total = youth.length;

    const age15to17 =
      youth.filter(
        (record) =>
          record.age !== null &&
          record.age >= 15 &&
          record.age <= 17
      ).length;

    const age18to24 =
      youth.filter(
        (record) =>
          record.age !== null &&
          record.age >= 18 &&
          record.age <= 24
      ).length;

    const age25to30 =
      youth.filter(
        (record) =>
          record.age !== null &&
          record.age >= 25 &&
          record.age <= 30
      ).length;

    const ageNotSet =
      youth.filter(
        (record) =>
          record.age === null
      ).length;

    const outsideYouthRange =
      youth.filter(
        (record) =>
          record.age !== null &&
          (record.age < 15 ||
            record.age > 30)
      ).length;

    const ageItems: CountItem[] = [
      {
        label: "15–17 years old",
        count: age15to17,
      },
      {
        label: "18–24 years old",
        count: age18to24,
      },
      {
        label: "25–30 years old",
        count: age25to30,
      },
      {
        label: "Age not set",
        count: ageNotSet,
      },
    ];

    if (outsideYouthRange > 0) {
      ageItems.push({
        label:
          "Outside 15–30 range",
        count: outsideYouthRange,
      });
    }

    return {
      total,
      withAge:
        total - ageNotSet,
      ageItems,
      sex: groupValues(
        youth,
        (record) => record.sex
      ),
      purok: groupValues(
        youth,
        (record) =>
          record.purokSitio
      ),
      classification:
        groupValues(
          youth,
          (record) =>
            record.youthClassification
        ),
    };
  }, [youth]);

  function renderCountSection(
    title: string,
    items: CountItem[]
  ) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <View style={styles.rows}>
          {items.map(
            (item, index) => {
              const percent =
                percentage(
                  item.count,
                  statistics.total
                );

              return (
                <View
                  key={`${title}-${item.label}`}
                  style={[
                    styles.statRow,
                    index <
                      items.length - 1 &&
                      styles.rowDivider,
                  ]}
                >
                  <View
                    style={
                      styles.statRowMain
                    }
                  >
                    <Text
                      style={
                        styles.statLabel
                      }
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>

                    <Text
                      style={
                        styles.statValue
                      }
                    >
                      {item.count}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.progressTrack
                    }
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            `${percent}%`,
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={
                      styles.percentText
                    }
                  >
                    {percent}%
                  </Text>
                </View>
              );
            }
          )}
        </View>
      </View>
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
          Youth Statistics
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading statistics...
          </Text>
        </View>
      ) : statistics.total === 0 ? (
        <View style={styles.centerState}>
          <Ionicons
            name="stats-chart-outline"
            size={44}
            color={colors.textMuted}
          />

          <Text style={styles.emptyTitle}>
            No youth data yet
          </Text>

          <Text style={styles.stateText}>
            Statistics will appear after
            youth records are added.
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
          <View style={styles.summaryCard}>
            <View
              style={
                styles.summaryIcon
              }
            >
              <Ionicons
                name="people-outline"
                size={28}
                color={colors.primary}
              />
            </View>

            <View
              style={
                styles.summaryText
              }
            >
              <Text
                style={
                  styles.summaryLabel
                }
              >
                Total Registered Youth
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {statistics.total}
              </Text>
            </View>
          </View>

          <View style={styles.quickSummary}>
            <View
              style={
                styles.quickSummaryItem
              }
            >
              <Text
                style={
                  styles.quickValue
                }
              >
                {statistics.withAge}
              </Text>
              <Text
                style={
                  styles.quickLabel
                }
              >
                With age
              </Text>
            </View>

            <View
              style={
                styles.quickDivider
              }
            />

            <View
              style={
                styles.quickSummaryItem
              }
            >
              <Text
                style={
                  styles.quickValue
                }
              >
                {
                  statistics.purok.filter(
                    (item) =>
                      item.label !==
                      "Not set"
                  ).length
                }
              </Text>
              <Text
                style={
                  styles.quickLabel
                }
              >
                Purok/Sitio
              </Text>
            </View>
          </View>

          {renderCountSection(
            "Age Distribution",
            statistics.ageItems
          )}

          {renderCountSection(
            "Sex Distribution",
            statistics.sex
          )}

          {renderCountSection(
            "Purok / Sitio Distribution",
            statistics.purok
          )}

          {renderCountSection(
            "Youth Classification",
            statistics.classification
          )}
        </ScrollView>
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

  headerSpacer: {
    width: 44,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    marginTop: spacing.lg,
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

  scroll: {
    flex: 1,
  },

  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  summaryCard: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
  },

  summaryIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
  },

  summaryText: {
    flex: 1,
    marginLeft: spacing.lg,
  },

  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  summaryValue: {
    marginTop: 2,
    fontSize: 30,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  quickSummary: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  quickSummaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  quickDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  quickValue: {
    fontSize: typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  quickLabel: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },

  section: {
    marginTop: spacing.xl,
  },

  sectionTitle: {
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  rows: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  statRow: {
    paddingVertical: spacing.md,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  statRowMain: {
    flexDirection: "row",
    alignItems: "center",
  },

  statLabel: {
    flex: 1,
    paddingRight: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  progressTrack: {
    height: 6,
    marginTop: spacing.sm,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  percentText: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "right",
  },
});
