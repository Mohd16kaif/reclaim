import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from "react-native";

const { TunnelBridge } = NativeModules;

const DNS_INSTALLED_KEY = "@reclaim_dns_profile_installed";

export const enableShield = async (): Promise<void> => {
  try {
    const result = await TunnelBridge.startTunnel();
    if (result?.success) {
      await AsyncStorage.setItem(DNS_INSTALLED_KEY, "installed");
      await AsyncStorage.setItem('@reclaim_tunnel_mode', 'vpn');
    } else {
      await AsyncStorage.setItem(DNS_INSTALLED_KEY, "pending");
      await AsyncStorage.setItem('@reclaim_tunnel_mode', 'vpn');
    }
  } catch {
    await AsyncStorage.setItem(DNS_INSTALLED_KEY, "pending");
    await AsyncStorage.setItem('@reclaim_tunnel_mode', 'vpn');
  }
};

export const confirmDNSInstalled = async (): Promise<void> => {
  await AsyncStorage.setItem(DNS_INSTALLED_KEY, "installed");
};

export const getDNSStatus = async (): Promise<
  "not_installed" | "pending" | "installed"
> => {
  try {
    const result = await TunnelBridge.getTunnelStatus();
    if (result?.status === "enabled") {
      return "installed";
    }
  } catch {}
  const status = await AsyncStorage.getItem(DNS_INSTALLED_KEY);
  if (!status) return "not_installed";
  return status as "not_installed" | "pending" | "installed";
};

export const resetDNSStatus = async (): Promise<void> => {
  try {
    await TunnelBridge.stopTunnel();
  } catch {}
  await AsyncStorage.removeItem(DNS_INSTALLED_KEY);
};
