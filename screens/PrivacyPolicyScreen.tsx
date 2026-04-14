import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import { ActivityIndicator, Linking, View } from "react-native";

const PRIVACY_POLICY_URL = "https://mohd16kaif.github.io/reclaim-privacy-policy/";

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
