import { Stack } from "expo-router";
import "../assets/css/global.css";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerBackButtonDisplayMode: "minimal",
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
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="product/[id]"
        options={{ title: "Product Detail", headerShadowVisible: false }}
      />
    </Stack>
  );
}
