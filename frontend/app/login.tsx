import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
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
      const BACKEND_URL =
        Platform.OS === "android"
          ? "http://10.0.2.2:5146"
          : "http://localhost:5146";
      const response = await fetch(`${BACKEND_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: email, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        await SecureStore.setItemAsync("jwtToken", data.token);
        router.dismissAll();
        router.replace({
          pathname: "/welcome",
          params: { username: data.username },
        } as any);
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to the server.");
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
          <Text className="text-4xl font-extrabold text-slate-900 mb-2">
            Welcome Back
          </Text>
          <Text className="text-slate-500 text-base mb-10">
            Sign in to continue to Enareview
          </Text>

          <View className="gap-5">
            <View>
              <Text className="text-slate-700 font-medium mb-2 ml-1">
                Email Address
              </Text>
              <TextInput
                className="w-full bg-slate-50 text-slate-900 px-5 py-4 rounded-2xl border border-slate-200 focus:border-red-500"
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="text-slate-700 font-medium mb-2 ml-1">
                Password
              </Text>
              <View className="w-full bg-slate-50 rounded-2xl border border-slate-200 focus:border-red-500 flex-row items-center px-5">
                <TextInput
                  className="flex-1 text-slate-900 py-4"
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
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
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity className="items-end mt-2">
              <Text className="text-red-600 font-semibold">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="gap-6 pt-6 mb-4">
          <TouchableOpacity
            className={`w-full ${loading ? "bg-red-400" : "bg-red-600 active:bg-red-700"} py-4 rounded-2xl items-center shadow-lg shadow-red-500/30`}
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
            <Text className="text-slate-500">Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/signup" as any)}>
              <Text className="text-red-600 font-bold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
