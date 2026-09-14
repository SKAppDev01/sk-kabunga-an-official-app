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
import Svg, {
  Circle,
} from "react-native-svg";

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

const CHART_COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#14B8A6",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#64748B",
];

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

function HorizontalBarChart({
  items,
  total,
}: {
  items: CountItem[];
  total: number;
}) {
  return (
    <View style={styles.barChart}>
      {items.map((item, index) => {
        const percent =
          percentage(
            item.count,
            total
          );

        const displayWidth =
          item.count > 0
            ? Math.max(percent, 3)
            : 0;

        return (
          <View
            key={`${item.label}-${index}`}
            style={[
              styles.barItem,
              index <
                items.length - 1 &&
                styles.barItemDivider,
            ]}
          >
            <View style={styles.barHeader}>
              <Text
                style={styles.barLabel}
              >
                {item.label}
              </Text>

              <View
                style={styles.barNumbers}
              >
                <Text
                  style={styles.barCount}
                >
                  {item.count}
                </Text>

                <Text
                  style={styles.barPercent}
                >
                  {percent}%
                </Text>
              </View>
            </View>

            <View
              style={styles.barTrack}
            >
              <View
                style={[
                  styles.barFill,
                  {
                    width:
                      `${displayWidth}%`,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function DonutChart({
  items,
  total,
}: {
  items: CountItem[];
  total: number;
}) {
  const size = 170;
  const strokeWidth = 22;
  const radius =
    (size - strokeWidth) / 2;
  const circumference =
    2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <View style={styles.donutSection}>
      <View style={styles.donutWrap}>
        <Svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />

          {items.map(
            (item, index) => {
              if (
                item.count <= 0 ||
                total <= 0
              ) {
                return null;
              }

              const fraction =
                item.count / total;

              const segmentLength =
                fraction *
                circumference;

              const offset =
                accumulated;

              accumulated +=
                segmentLength;

              return (
                <Circle
                  key={`${item.label}-${index}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={
                    CHART_COLORS[
                      index %
                        CHART_COLORS.length
                    ]
                  }
                  strokeWidth={
                    strokeWidth
                  }
                  strokeDasharray={`${segmentLength} ${
                    circumference -
                    segmentLength
                  }`}
                  strokeDashoffset={
                    -offset
                  }
                  strokeLinecap="butt"
                  rotation={-90}
                  originX={
                    size / 2
                  }
                  originY={
                    size / 2
                  }
                />
              );
            }
          )}
        </Svg>

        <View
          pointerEvents="none"
          style={
            styles.donutCenter
          }
        >
          <Text
            style={
              styles.donutTotal
            }
          >
            {total}
          </Text>

          <Text
            style={
              styles.donutTotalLabel
            }
          >
            Total
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        {items.map(
          (item, index) => {
            const percent =
              percentage(
                item.count,
                total
              );

            return (
              <View
                key={`${item.label}-${index}`}
                style={
                  styles.legendRow
                }
              >
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor:
                        CHART_COLORS[
                          index %
                            CHART_COLORS.length
                        ],
                    },
                  ]}
                />

                <Text
                  style={
                    styles.legendLabel
                  }
                >
                  {item.label}
                </Text>

                <Text
                  style={
                    styles.legendValue
                  }
                >
                  {item.count}
                  {" • "}
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
          Youth Statistics
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      {isLoading ? (
        <View
          style={styles.centerState}
        >
          <Text
            style={styles.stateText}
          >
            Loading statistics...
          </Text>
        </View>
      ) : statistics.total === 0 ? (
        <View
          style={styles.centerState}
        >
          <Ionicons
            name="stats-chart-outline"
            size={44}
            color={colors.textMuted}
          />

          <Text
            style={styles.emptyTitle}
          >
            No youth data yet
          </Text>

          <Text
            style={styles.stateText}
          >
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
          <View
            style={styles.summaryCard}
          >
            <View
              style={styles.summaryIcon}
            >
              <Ionicons
                name="people-outline"
                size={28}
                color={colors.primary}
              />
            </View>

            <View
              style={styles.summaryText}
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

          <View
            style={styles.quickSummary}
          >
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
              style={styles.quickDivider}
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
                Purok / Sitio
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Age Distribution
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Registered youth grouped by
              SK age range.
            </Text>

            <HorizontalBarChart
              items={
                statistics.ageItems
              }
              total={
                statistics.total
              }
            />
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Sex Distribution
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Share of registered youth by
              recorded sex.
            </Text>

            <DonutChart
              items={statistics.sex}
              total={
                statistics.total
              }
            />
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Purok / Sitio Distribution
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Registered youth by local
              area.
            </Text>

            <HorizontalBarChart
              items={
                statistics.purok
              }
              total={
                statistics.total
              }
            />
          </View>

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Youth Classification
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Distribution by recorded
              youth classification.
            </Text>

            <HorizontalBarChart
              items={
                statistics.classification
              }
              total={
                statistics.total
              }
            />
          </View>
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
    minWidth: 0,
    textAlign: "center",
    fontSize:
      typography.fontSize.lg,
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
    paddingHorizontal:
      spacing.xl,
  },

  emptyTitle: {
    width: "100%",
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
    maxWidth: 300,
    minWidth: 0,
    marginTop: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color:
      colors.textSecondary,
    textAlign: "center",
    flexShrink: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: spacing.xl,
    paddingBottom:
      spacing.xxxl +
      spacing.xl,
  },

  summaryCard: {
    elevation: 3,
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius: 16,
    backgroundColor:
      colors.white,
  },

  summaryIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor:
      "#EFF6FF",
    flexShrink: 0,
  },

  summaryText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.lg,
  },

  summaryLabel: {
    width: "100%",
    minWidth: 0,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color:
      colors.textSecondary,
    flexShrink: 1,
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
    borderBottomColor:
      colors.border,
  },

  quickSummaryItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:
      spacing.xs,
  },

  quickDivider: {
    width: 1,
    height: 40,
    backgroundColor:
      colors.border,
  },

  quickValue: {
    fontSize:
      typography.fontSize.xl,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
  },

  quickLabel: {
    width: "100%",
    minWidth: 0,
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textMuted,
    textAlign: "center",
    flexShrink: 1,
  },

  section: {
    marginTop: spacing.xl,
  },

  sectionTitle: {
    width: "100%",
    minWidth: 0,
    fontSize:
      typography.fontSize.md,
    lineHeight: 22,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    flexShrink: 1,
  },

  sectionDescription: {
    width: "100%",
    minWidth: 0,
    marginTop: 4,
    fontSize:
      typography.fontSize.xs,
    lineHeight: 18,
    color:
      colors.textSecondary,
    flexShrink: 1,
  },

  barChart: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  barItem: {
    paddingVertical:
      spacing.md,
  },

  barItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  barHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  barLabel: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text,
    flexShrink: 1,
  },

  barNumbers: {
    minWidth: 72,
    flexShrink: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
  },

  barCount: {
    fontSize:
      typography.fontSize.sm,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "right",
  },

  barPercent: {
    minWidth: 38,
    marginLeft: spacing.xs,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: "right",
  },

  barTrack: {
    height: 10,
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor:
      "#E5E7EB",
  },

  barFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor:
      colors.primary,
  },

  donutSection: {
    alignItems: "center",
    marginTop: spacing.lg,
  },

  donutWrap: {
    width: 170,
    height: 170,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  donutCenter: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  donutTotal: {
    fontSize: 28,
    fontWeight:
      typography.fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  donutTotalLabel: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textMuted,
    textAlign: "center",
  },

  legend: {
    width: "100%",
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  legendRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical:
      spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },

  legendLabel: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
    paddingRight: spacing.sm,
    fontSize:
      typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text,
    flexShrink: 1,
  },

  legendValue: {
    minWidth: 74,
    flexShrink: 0,
    fontSize: 10,
    lineHeight: 16,
    color:
      colors.textSecondary,
    textAlign: "right",
  },
});
