import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";

// ============================================================================
// CONFIG
// ============================================================================

export const DNS_PROFILE_URL = '';

const DNS_INSTALLED_KEY = "@reclaim_dns_profile_installed";

// ============================================================================
// INSTALL DNS PROFILE
// Opens the .mobileconfig file — iOS shows native Install Profile prompt
// ============================================================================

export const enableShield = async (): Promise<void> => {
  // VPN tunnel is started via native bridge
  // This will be wired to TunnelBridge after Mac session
  // For now mark as pending so UI reflects correct state
  await AsyncStorage.setItem(DNS_INSTALLED_KEY, 'pending');
  await AsyncStorage.setItem('@reclaim_tunnel_mode', 'vpn');
};

// ============================================================================
// MARK DNS AS CONFIRMED
// Call this when user comes back to app after installing
// ============================================================================

export const confirmDNSInstalled = async (): Promise<void> => {
  await AsyncStorage.setItem(DNS_INSTALLED_KEY, "installed");
};

// ============================================================================
// CHECK DNS STATUS
// Returns: 'not_installed' | 'pending' | 'installed'
// ============================================================================

export const getDNSStatus = async (): Promise<
  "not_installed" | "pending" | "installed"
> => {
  const status = await AsyncStorage.getItem(DNS_INSTALLED_KEY);
  if (!status) return "not_installed";
  return status as "not_installed" | "pending" | "installed";
};

// ============================================================================
// REMOVE DNS STATUS (when user disables blocker)
// ============================================================================

export const resetDNSStatus = async (): Promise<void> => {
  await AsyncStorage.removeItem(DNS_INSTALLED_KEY);
};
