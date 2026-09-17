import { useNavigation } from "expo-router/react-navigation";
import React, { useEffect } from "react";
import { ActivityIndicator, Linking, View } from "react-native";
import { PRIVACY_POLICY_URL } from "../constants/legal";

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Open in browser and go back immediately
    Linking.openURL(PRIVACY_POLICY_URL);
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
};

export default PrivacyPolicyScreen;
