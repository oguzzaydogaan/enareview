import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      <ScrollView className="flex-1 px-4 py-6">
        {/* User Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 items-center">
          {/* Avatar */}
          <View className="w-24 h-24 bg-green-50 rounded-full mb-4 items-center justify-center border-4 border-green-100">
            <Text className="text-green-600 font-bold text-3xl">
              {profile?.username?.substring(0, 2).toUpperCase() || "US"}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {profile?.username}
          </Text>
          <View className="flex-row items-center gap-1 mb-6">
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text className="text-gray-400 text-sm">
              Member since{" "}
              {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}
            </Text>
          </View>

          {/* Info Card */}
          <View className="w-full bg-gray-50 rounded-2xl p-5 gap-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-green-50 rounded-xl items-center justify-center mr-3">
                <Ionicons name="mail-outline" size={18} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-0.5">
                  Email
                </Text>
                <Text className="text-gray-800 font-medium text-base">
                  {profile?.email || "N/A"}
                </Text>
              </View>
            </View>
            <View className="h-px bg-gray-200 ml-[52px]" />
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-green-50 rounded-xl items-center justify-center mr-3">
                <Ionicons name="call-outline" size={18} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-0.5">
                  Phone
                </Text>
                <Text className="text-gray-800 font-medium text-base">
                  {profile?.phoneNumber || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="w-full bg-gray-900 active:bg-gray-800 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-gray-900/20"
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
    </View>
  );
}
