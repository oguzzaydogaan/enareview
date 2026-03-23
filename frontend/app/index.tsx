import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <View className="w-full max-w-sm items-center">
        <View className="w-24 h-24 bg-red-500 rounded-3xl mb-8 items-center justify-center shadow-lg shadow-red-500/50">
          <Text className="text-white text-4xl font-extrabold">E</Text>
        </View>
        
        <Text className="text-4xl font-extrabold text-slate-900 mb-2 text-center">
          Enareview
        </Text>
        <Text className="text-slate-500 text-base text-center mb-12">
          Discover and share authentic reviews with the community.
        </Text>

        <View className="w-full gap-4">
          <TouchableOpacity 
            className="w-full bg-red-600 active:bg-red-700 py-4 rounded-2xl items-center shadow-lg shadow-red-500/30"
            onPress={() => router.push("/login" as any)}
          >
            <Text className="text-white font-bold text-lg">Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="w-full bg-white active:bg-slate-50 py-4 rounded-2xl items-center border border-slate-300 shadow-sm"
            onPress={() => router.push("/signup" as any)}
          >
            <Text className="text-slate-900 font-bold text-lg">Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
