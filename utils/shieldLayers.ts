// ============================================================================
// RECLAIM SHIELD — Layer Definitions
// utils/shieldLayers.ts
//
// Single source of truth for all 8 shield layers.
// Import this wherever you need layer config, labels, or status.
// ============================================================================

export type LayerStatus = "active" | "partial" | "inactive" | "unavailable";

export interface ShieldLayer {
  id: number;
  key: ShieldLayerKey;
  name: string;
  shortName: string;
  description: string;
  // Whether this layer requires native entitlements (Mac + Apple approval)
  requiresNative: boolean;
  // Whether this layer requires user action in Settings
  requiresUserAction: boolean;
  // Weight for overall shield score (must all sum to 100)
  weight: number;
}

export type ShieldLayerKey =
  | "dns_shield"
  | "safe_search"
  | "social_media_block"
  | "bypass_resistance"
  | "os_level"
  | "watchdog"
  | "self_heal"
  | "status_system";

export type ShieldLayerStatuses = Record<ShieldLayerKey, LayerStatus>;

// ============================================================================
// LAYER DEFINITIONS
// ============================================================================

export const SHIELD_LAYERS: ShieldLayer[] = [
  {
    id: 1,
    key: "dns_shield",
    name: "DNS Shield",
    shortName: "DNS",
    description:
      "Blocks all known adult domains system-wide across every browser and app.",
    requiresNative: true,
    requiresUserAction: false,
    weight: 30,
  },
  {
    id: 2,
    key: "safe_search",
    name: "Safe Search",
    shortName: "SafeSearch",
    description:
      "Forces Google, YouTube, Bing, and DuckDuckGo into strict safe mode.",
    requiresNative: true,
    requiresUserAction: false,
    weight: 15,
  },
  {
    id: 3,
    key: "social_media_block",
    name: "Social Media Filter",
    shortName: "Social",
    description:
      "Blocks known adult CDN servers and NSFW media hosts used by social apps.",
    requiresNative: true,
    requiresUserAction: false,
    weight: 15,
  },
  {
    id: 4,
    key: "bypass_resistance",
    name: "Bypass Resistance",
    shortName: "Bypass",
    description:
      "Blocks VPN download sites, proxy tools, Tor domains, and alt DNS providers.",
    requiresNative: true,
    requiresUserAction: false,
    weight: 15,
  },
  {
    id: 5,
    key: "os_level",
    name: "OS-Level Filter",
    shortName: "Screen Time",
    description:
      "iOS Screen Time adult content filter adds a second protection layer.",
    requiresNative: false,
    requiresUserAction: true,
    weight: 10,
  },
  {
    id: 6,
    key: "watchdog",
    name: "Watchdog Monitor",
    shortName: "Watchdog",
    description:
      "Constantly monitors all layers and alerts if protection breaks.",
    requiresNative: false,
    requiresUserAction: false,
    weight: 5,
  },
  {
    id: 7,
    key: "self_heal",
    name: "Self-Heal",
    shortName: "Self-Heal",
    description:
      "Auto-detects broken protection and guides you through re-enabling it.",
    requiresNative: false,
    requiresUserAction: false,
    weight: 5,
  },
  {
    id: 8,
    key: "status_system",
    name: "Protection Status",
    shortName: "Status",
    description:
      "Real-time shield health dashboard with green / yellow / red awareness.",
    requiresNative: false,
    requiresUserAction: false,
    weight: 5,
  },
];

// ============================================================================
// OVERALL SHIELD SCORE
// Computes 0–100 score based on active layer weights
// ============================================================================

export const computeShieldScore = (statuses: ShieldLayerStatuses): number => {
  let score = 0;
  for (const layer of SHIELD_LAYERS) {
    const status = statuses[layer.key];
    if (status === "active") {
      score += layer.weight;
    } else if (status === "partial") {
      score += Math.round(layer.weight * 0.5);
    }
    // inactive / unavailable = 0
  }
  return Math.min(100, score);
};

// ============================================================================
// OVERALL SHIELD STATE
// Derives the top-level green/yellow/red state from the score
// ============================================================================

export type OverallShieldState = "protected" | "partial" | "vulnerable";

export const getOverallShieldState = (score: number): OverallShieldState => {
  if (score >= 70) return "protected";
  if (score >= 35) return "partial";
  return "vulnerable";
};

export const SHIELD_STATE_LABELS: Record<OverallShieldState, string> = {
  protected: "🟢 Fully Protected",
  partial: "🟡 Partial Protection",
  vulnerable: "🔴 Protection Disabled",
};

export const SHIELD_STATE_COLORS: Record<OverallShieldState, string> = {
  protected: "#22C55E",
  partial: "#F59E0B",
  vulnerable: "#EF4444",
};

// ============================================================================
// DEFAULT STATUSES
// Used before first Watchdog check runs
// ============================================================================

export const DEFAULT_LAYER_STATUSES: ShieldLayerStatuses = {
  dns_shield: "inactive",
  safe_search: "inactive",
  social_media_block: "inactive",
  bypass_resistance: "inactive",
  os_level: "unavailable",
  watchdog: "inactive",
  self_heal: "active", // always considered active once app is installed
  status_system: "active", // always active
};
