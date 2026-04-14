import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import {
  DEFAULT_LAYER_STATUSES,
  LayerStatus,
  SHIELD_LAYERS,
  SHIELD_STATE_COLORS,
  SHIELD_STATE_LABELS,
  ShieldLayerStatuses,
  getOverallShieldState
} from "../utils/shieldLayers";
import { getFullShieldStatus } from "../utils/shieldManager";
import { triggerManualCheck } from "../utils/watchdog";

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
  ShieldStatus: undefined;
  SelfHeal: undefined;
  Blocker: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, "ShieldStatus">;

// ============================================================================
// ICONS
// ============================================================================

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke="#000000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RefreshIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 4v6h6M23 20v-6h-6"
      stroke="#000000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
      stroke="#000000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ============================================================================
// LAYER STATUS COLORS & LABELS
// ============================================================================

const STATUS_COLORS: Record<LayerStatus, string> = {
  active: "#22C55E",
  partial: "#F59E0B",
  inactive: "#EF4444",
  unavailable: "#C7C7CC",
};

const STATUS_LABELS: Record<LayerStatus, string> = {
  active: "Active",
  partial: "Partial",
  inactive: "Inactive",
  unavailable: "Not Set",
};

const STATUS_BG: Record<LayerStatus, string> = {
  active: "#F0FDF4",
  partial: "#FFFBEB",
  inactive: "#FEF2F2",
  unavailable: "#F9FAFB",
};

// ============================================================================
// LAYER CARD
// ============================================================================

const LayerCard = ({
  layer,
  status,
  index,
}: {
  layer: (typeof SHIELD_LAYERS)[0];
  status: LayerStatus;
  index: number;
}) => {
  const color = STATUS_COLORS[status];
  const bg = STATUS_BG[status];

  return (
    <View style={[styles.layerCard, { borderLeftColor: color }]}>
      <View style={styles.layerCardTop}>
        <View style={styles.layerCardLeft}>
          <View style={[styles.layerIndexBadge, { backgroundColor: color + "20" }]}>
            <Text style={[styles.layerIndexText, { color }]}>
              {String(index).padStart(2, "0")}
            </Text>
          </View>
          <View style={styles.layerCardTitles}>
            <Text style={styles.layerCardName}>{layer.name}</Text>
            {layer.requiresNative && (
              <View style={styles.nativeBadge}>
                <Text style={styles.nativeBadgeText}>Needs Mac</Text>
              </View>
            )}
            {layer.requiresUserAction && (
              <View style={styles.userActionBadge}>
                <Text style={styles.userActionBadgeText}>Manual Setup</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: bg, borderColor: color + "40" }]}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.statusPillText, { color }]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      <Text style={styles.layerCardDesc}>{layer.description}</Text>

      {/* Weight bar */}
      <View style={styles.weightRow}>
        <Text style={styles.weightLabel}>Impact</Text>
        <View style={styles.weightBarBg}>
          <View style={[styles.weightBarFill, { width: `${layer.weight}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.weightValue}>{layer.weight}%</Text>
      </View>
    </View>
  );
};

// ============================================================================
// SCORE SUMMARY BAR
// ============================================================================

const ScoreSummaryBar = ({
  score,
  state,
}: {
  score: number;
  state: string;
}) => {
  const color = SHIELD_STATE_COLORS[state as keyof typeof SHIELD_STATE_COLORS] ?? "#C7C7CC";
  const label = SHIELD_STATE_LABELS[state as keyof typeof SHIELD_STATE_LABELS] ?? "Unknown";

  return (
    <View style={[styles.scoreSummary, { borderColor: color + "30" }]}>
      <View style={styles.scoreLeft}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={styles.scoreMax}>/100</Text>
      </View>
      <View style={styles.scoreRight}>
        <Text style={[styles.scoreStateLabel, { color }]}>{label}</Text>
        <View style={styles.scoreBarBg}>
          <View
            style={[
              styles.scoreBarFill,
              { width: `${score}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================

const ShieldStatusScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [layerStatuses, setLayerStatuses] = useState<ShieldLayerStatuses>(DEFAULT_LAYER_STATUSES);
  const [shieldScore, setShieldScore] = useState(0);
  const [lastVerified, setLastVerified] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const snapshot = await getFullShieldStatus();
      setLayerStatuses(snapshot.layerStatuses);
      setShieldScore(snapshot.shieldScore);
      setLastVerified(snapshot.lastVerifiedAt);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await triggerManualCheck();
      setLayerStatuses(result.layerStatuses);
      setShieldScore(result.currentScore);
      setLastVerified(Date.now());
    } finally {
      setRefreshing(false);
    }
  };

  const overallState = getOverallShieldState(shieldScore);

  const activeLayers = SHIELD_LAYERS.filter(
    (l) => layerStatuses[l.key] === "active"
  ).length;

  const formatLastVerified = (ts: number | null): string => {
    if (!ts) return "Not yet verified";
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shield Status</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <RefreshIcon />
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Checking layers...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Score summary */}
            <ScoreSummaryBar score={shieldScore} state={overallState} />

            {/* Quick stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{activeLayers}</Text>
                <Text style={styles.quickStatLabel}>Layers Active</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{SHIELD_LAYERS.length - activeLayers}</Text>
                <Text style={styles.quickStatLabel}>Inactive</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{formatLastVerified(lastVerified)}</Text>
                <Text style={styles.quickStatLabel}>Last Check</Text>
              </View>
            </View>

            {/* Section header */}
            <Text style={styles.sectionHeader}>All 8 Protection Layers</Text>

            {/* Layer cards */}
            {SHIELD_LAYERS.map((layer, i) => (
              <LayerCard
                key={layer.key}
                layer={layer}
                status={layerStatuses[layer.key]}
                index={i + 1}
              />
            ))}

            {/* Self heal CTA if any layers broken */}
            {(layerStatuses.dns_shield === "inactive" ||
              layerStatuses.dns_shield === "partial") && (
              <TouchableOpacity
                style={styles.selfHealCTA}
                onPress={() => navigation.navigate("SelfHeal")}
                activeOpacity={0.85}
              >
                <Text style={styles.selfHealCTATitle}>Protection needs attention</Text>
                <Text style={styles.selfHealCTADesc}>
                  Tap to run the Self-Heal flow and restore your shield
                </Text>
              </TouchableOpacity>
            )}

            {/* Legend */}
            <View style={styles.legend}>
              <Text style={styles.legendTitle}>Status Guide</Text>
              {(["active", "partial", "inactive", "unavailable"] as LayerStatus[]).map((s) => (
                <View key={s} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[s] }]} />
                  <Text style={styles.legendLabel}>{STATUS_LABELS[s]}</Text>
                  <Text style={styles.legendDesc}>
                    {s === "active" && "Layer is fully working"}
                    {s === "partial" && "Layer is working but can be stronger"}
                    {s === "inactive" && "Layer is off — protection gap"}
                    {s === "unavailable" && "Requires manual setup"}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

export default ShieldStatusScreen;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#000000" },
  refreshButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  // Loading
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#8E8E93" },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  // Score summary
  scoreSummary: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20,
    marginBottom: 12, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  scoreLeft: { flexDirection: "row", alignItems: "baseline", marginRight: 20 },
  scoreNumber: { fontSize: 48, fontWeight: "800", lineHeight: 56 },
  scoreMax: { fontSize: 16, color: "#8E8E93", fontWeight: "500", marginLeft: 2 },
  scoreRight: { flex: 1 },
  scoreStateLabel: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  scoreBarBg: { height: 6, backgroundColor: "#F3F4F6", borderRadius: 3 },
  scoreBarFill: { height: 6, borderRadius: 3 },

  // Quick stats
  quickStats: {
    flexDirection: "row", backgroundColor: "#F9FAFB",
    borderRadius: 14, padding: 16, marginBottom: 20,
  },
  quickStatItem: { flex: 1, alignItems: "center" },
  quickStatValue: { fontSize: 18, fontWeight: "700", color: "#000000" },
  quickStatLabel: { fontSize: 11, color: "#8E8E93", marginTop: 2 },
  quickStatDivider: { width: 1, backgroundColor: "#E5E5EA", marginHorizontal: 8 },

  // Section
  sectionHeader: {
    fontSize: 13, fontWeight: "600", color: "#8E8E93",
    textTransform: "uppercase", letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Layer card
  layerCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16,
    marginBottom: 10, borderLeftWidth: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    borderWidth: 1, borderColor: "#F3F4F6",
  },
  layerCardTop: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 8,
  },
  layerCardLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  layerIndexBadge: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  layerIndexText: { fontSize: 13, fontWeight: "800" },
  layerCardTitles: { flex: 1 },
  layerCardName: { fontSize: 15, fontWeight: "700", color: "#000000" },

  // Badges
  nativeBadge: {
    backgroundColor: "#EFF6FF", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginTop: 3,
  },
  nativeBadgeText: { fontSize: 10, color: "#3B82F6", fontWeight: "600" },
  userActionBadge: {
    backgroundColor: "#FFF7ED", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginTop: 3,
  },
  userActionBadgeText: { fontSize: 10, color: "#F59E0B", fontWeight: "600" },

  // Status pill
  statusPill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, flexShrink: 0,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusPillText: { fontSize: 12, fontWeight: "600" },

  layerCardDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginBottom: 10 },

  // Weight bar
  weightRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  weightLabel: { fontSize: 11, color: "#8E8E93", width: 36 },
  weightBarBg: { flex: 1, height: 4, backgroundColor: "#F3F4F6", borderRadius: 2 },
  weightBarFill: { height: 4, borderRadius: 2 },
  weightValue: { fontSize: 11, color: "#8E8E93", width: 28, textAlign: "right" },

  // Self heal CTA
  selfHealCTA: {
    backgroundColor: "#FEF3C7", borderRadius: 14, padding: 16,
    marginTop: 8, marginBottom: 16,
    borderWidth: 1, borderColor: "#FDE68A",
  },
  selfHealCTATitle: { fontSize: 15, fontWeight: "700", color: "#92400E", marginBottom: 4 },
  selfHealCTADesc: { fontSize: 13, color: "#B45309", lineHeight: 18 },

  // Legend
  legend: {
    backgroundColor: "#F9FAFB", borderRadius: 14, padding: 16, marginTop: 8,
  },
  legendTitle: { fontSize: 13, fontWeight: "600", color: "#000000", marginBottom: 10 },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  legendLabel: { fontSize: 13, fontWeight: "600", color: "#000000", width: 70 },
  legendDesc: { fontSize: 12, color: "#6B7280", flex: 1 },
});