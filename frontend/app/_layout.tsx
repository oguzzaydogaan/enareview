import { Stack } from "expo-router";
import "../assets/css/global.css";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Log In", headerShadowVisible: false }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up", headerShadowVisible: false }} />
    </Stack>
  );
}
