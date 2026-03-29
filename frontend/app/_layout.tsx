import { Stack } from "expo-router";
import "../assets/css/global.css";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{ title: "Log In", headerShadowVisible: false }}
      />
      <Stack.Screen
        name="signup"
        options={{ title: "Sign Up", headerShadowVisible: false }}
      />
      <Stack.Screen
        name="welcome"
        options={{ title: "Welcome", headerShadowVisible: false }}
      />
    </Stack>
  );
}
