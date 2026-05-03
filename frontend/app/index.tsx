import { Text, View, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as SecureStore from 'expo-secure-store';
import { userService } from '../services/userService';

export default function Index() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("jwtToken");
        if (!token) {
          setIsCheckingAuth(false);
          return;
        }

        const response = await userService.refresh();
        const data = response.data;
        await SecureStore.setItemAsync("jwtToken", data.token);
        router.replace({ pathname: "/products", params: { username: data.username } } as any);
      } catch (error) {
        console.error("Token refresh fetch error:", error);
        await SecureStore.deleteItemAsync("jwtToken");
        setIsCheckingAuth(false);
      }
    };

    checkToken();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      {/* Decorative background circles */}
      <View className="absolute top-[-80px] right-[-60px] w-64 h-64 rounded-full bg-green-50 opacity-60" />
      <View className="absolute bottom-[-40px] left-[-40px] w-48 h-48 rounded-full bg-green-50 opacity-40" />

      <View className="w-full max-w-sm items-center">
        <View className="w-28 h-28 bg-green-500 rounded-[28px] mb-10 items-center justify-center shadow-xl shadow-green-500/40">
          <Text className="text-white text-5xl font-extrabold">E</Text>
        </View>
        
        <Text className="text-4xl font-extrabold text-gray-900 mb-3 text-center">
          Enareview
        </Text>
        <Text className="text-gray-400 text-base text-center mb-14 leading-relaxed px-4">
          Discover and share authentic reviews with the community.
        </Text>

        <View className="w-full gap-4">
          <TouchableOpacity 
            className="w-full bg-green-500 active:bg-green-600 py-4 rounded-2xl items-center shadow-lg shadow-green-500/30"
            onPress={() => router.push("/login" as any)}
          >
            <Text className="text-white font-bold text-lg">Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="w-full bg-white active:bg-gray-50 py-4 rounded-2xl items-center border-2 border-green-500"
            onPress={() => router.push("/signup" as any)}
          >
            <Text className="text-green-600 font-bold text-lg">Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
