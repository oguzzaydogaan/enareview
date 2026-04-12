import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { userService } from "../../services/userService";

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userService.getProfile();
        setProfile(response.data);
      } catch (error: any) {
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to load profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("jwtToken");
    router.replace("/" as any);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      <ScrollView className="flex-1 px-4 py-6">
        {/* User Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8 items-center">
          <View className="w-24 h-24 bg-red-100 rounded-full mb-4 items-center justify-center">
            <Text className="text-red-700 font-bold text-3xl">
              {profile?.username?.substring(0, 2).toUpperCase() || "US"}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-slate-900 mb-1">
            {profile?.username}
          </Text>
          <Text className="text-slate-500 mb-6">
            Member since{" "}
            {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}
          </Text>

          <View className="w-full bg-slate-50 rounded-2xl p-4 gap-4">
            <View>
              <Text className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                Email
              </Text>
              <Text className="text-slate-800 font-medium text-lg">
                {profile?.email || "N/A"}
              </Text>
            </View>
            <View className="h-px bg-slate-200" />
            <View>
              <Text className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                Phone
              </Text>
              <Text className="text-slate-800 font-medium text-lg">
                {profile?.phoneNumber || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={handleLogout}
          className="w-full bg-slate-900 active:bg-slate-800 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-slate-900/20"
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color="#ffffff"
            className="mr-2"
          />
          <Text className="text-white font-bold text-lg ml-2">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
