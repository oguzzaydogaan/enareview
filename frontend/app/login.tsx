import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { userService } from "../services/userService";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await userService.login({ usernameOrEmail: email, password });
      const data = response.data;

      await SecureStore.setItemAsync("jwtToken", data.token);
      router.dismissAll();
      router.replace({
        pathname: "/products",
        params: { username: data.username },
      } as any);
    } catch (error: any) {
      if (error.response) {
        Alert.alert("Login Failed", error.response.data?.message || "Invalid credentials.");
      } else {
        Alert.alert("Error", "Could not connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-6 pt-6 pb-8 justify-between">
        <View>
          {/* Header icon */}
          <View className="w-14 h-14 bg-green-50 rounded-2xl items-center justify-center mb-6">
            <Ionicons name="log-in-outline" size={28} color="#22c55e" />
          </View>

          <Text className="text-4xl font-extrabold text-gray-900 mb-2">
            Welcome Back
          </Text>
          <Text className="text-gray-400 text-base mb-10">
            Sign in to continue to Enareview
          </Text>

          <View className="gap-5">
            <View>
              <Text className="text-gray-700 font-semibold mb-2 ml-1">
                Email Address
              </Text>
              <TextInput
                className="w-full bg-gray-50 text-gray-900 px-5 py-4 rounded-2xl border border-gray-200 focus:border-green-500"
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="text-gray-700 font-semibold mb-2 ml-1">
                Password
              </Text>
              <View className="w-full bg-gray-50 rounded-2xl border border-gray-200 focus:border-green-500 flex-row items-center px-5">
                <TextInput
                  className="flex-1 text-gray-900 py-4"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="pl-3"
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity className="items-end mt-2">
              <Text className="text-green-600 font-semibold">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="gap-6 pt-6 mb-4">
          <TouchableOpacity
            className={`w-full ${loading ? "bg-green-300" : "bg-green-500 active:bg-green-600"} py-4 rounded-2xl items-center shadow-lg shadow-green-500/30`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Log In</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center gap-1">
            <Text className="text-gray-400">Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/signup" as any)}>
              <Text className="text-green-600 font-bold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
