import { Text, View, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from 'expo-secure-store';

export default function Welcome() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const username = params.username || "User";

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("jwtToken");
    router.replace("/" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center items-center">
        <View className="w-24 h-24 bg-green-100 rounded-full mb-8 items-center justify-center">
          <Ionicons name="checkmark-circle" size={60} color="#16a34a" />
        </View>
        
        <Text className="text-4xl font-extrabold text-slate-900 mb-2 text-center">
          Welcome back,
        </Text>
        <Text className="text-4xl font-extrabold text-red-600 mb-6 text-center">
          {username}!
        </Text>
        
        <Text className="text-slate-500 text-base text-center mb-12 max-w-xs">
          You have successfully logged in using your JSON Web Token. You are now ready to explore Enareview.
        </Text>

        <TouchableOpacity 
          className="w-full max-w-xs bg-slate-900 active:bg-slate-800 py-4 rounded-2xl items-center shadow-lg shadow-slate-900/30"
          onPress={handleLogout}
        >
          <Text className="text-white font-bold text-lg">Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
