import { Ionicons } from "@expo/vector-icons";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { useRouter } from "expo-router";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, firebaseConfig } from "./firebaseConfig";
import { userService } from "../services/userService";

export default function SignUp() {
  const router = useRouter();
  const recaptchaVerifier = useRef(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showOTPModal, setShowOTPModal] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !phoneNumber) {
      alert("Please fill all fields.");
      return;
    }

    if (!phoneNumber.startsWith("+")) {
      alert("Please include your country code (e.g., +90...)");
      return;
    }

    try {
      setLoading(true);

      const phoneProvider = new PhoneAuthProvider(auth);
      const verifyId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current as any,
      );

      setVerificationId(verifyId);
      setShowOTPModal(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!verificationCode) {
      alert("Please enter the verification code.");
      return;
    }

    try {
      setLoading(true);

      // 1. Verify OTP with Firebase
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode,
      );
      const userCredential = await signInWithCredential(auth, credential);

      // 2. Get Firebase IdToken
      const idToken = await userCredential.user?.getIdToken();
      if (!idToken) throw new Error("Failed to get Firebase token.");

      // 3. Create verified user in the backend
      await userService.signup({
        Username: name,
        Email: email,
        Password: password,
        PhoneNumber: phoneNumber,
        FirebaseToken: idToken,
      });

      // Success! User is created and phone is verified.
      alert("Account created and verified successfully!");
      setShowOTPModal(false);
      router.push("/login" as any);
    } catch (err: any) {
      if (err.response) {
        alert(err.response.data?.message || err.response.data?.title || "Signup failed in backend.");
      } else {
        alert(err.message);
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
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-6 pb-8 justify-between">
          <View>
            <Text className="text-4xl font-extrabold text-slate-900 mb-2">
              Create Account
            </Text>
            <Text className="text-slate-500 text-base mb-10">
              Join Enareview to start exploring
            </Text>

            <View className="gap-5">
              <View>
                <Text className="text-slate-700 font-medium mb-2 ml-1">
                  Username
                </Text>
                <TextInput
                  className="w-full bg-slate-50 text-slate-900 px-5 py-4 rounded-2xl border border-slate-200 focus:border-red-500"
                  placeholder="Enter your username"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>

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
                  editable={!loading}
                />
              </View>

              <View>
                <Text className="text-slate-700 font-medium mb-2 ml-1">
                  Phone Number
                </Text>
                <TextInput
                  className="w-full bg-slate-50 text-slate-900 px-5 py-4 rounded-2xl border border-slate-200 focus:border-red-500"
                  placeholder="+1234567890"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  editable={!loading}
                />
              </View>

              <View>
                <Text className="text-slate-700 font-medium mb-2 ml-1">
                  Password
                </Text>
                <View className="w-full bg-slate-50 rounded-2xl border border-slate-200 focus:border-red-500 flex-row items-center px-5">
                  <TextInput
                    className="flex-1 text-slate-900 py-4"
                    placeholder="Create a password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
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
            </View>
          </View>

          <View className="gap-6 pt-10 mb-4">
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              className={`w-full py-4 rounded-2xl items-center shadow-lg ${loading ? "bg-red-400 shadow-none" : "bg-red-600 shadow-red-500/30"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Sign Up</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center gap-1">
              <Text className="text-slate-500">Already have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push("/login" as any)}
                disabled={loading}
              >
                <Text className="text-red-600 font-bold">Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal visible={showOTPModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="w-full bg-white rounded-3xl p-6 items-center">
            <Text className="text-2xl font-bold text-slate-900 mb-2">
              Verify Phone
            </Text>
            <Text className="text-slate-500 text-center mb-6">
              Enter the verification code sent to {phoneNumber}
            </Text>

            <TextInput
              className="w-full bg-slate-50 text-slate-900 px-5 py-4 text-center text-xl tracking-widest rounded-2xl border border-slate-200 focus:border-red-500 mb-6"
              placeholder="000000"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              value={verificationCode}
              onChangeText={setVerificationCode}
              maxLength={6}
            />

            <TouchableOpacity
              onPress={handleVerifyOTP}
              disabled={loading}
              className={`w-full py-4 rounded-2xl items-center mb-4 ${loading ? "bg-red-400" : "bg-red-600"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Verify & Continue
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowOTPModal(false)}
              disabled={loading}
            >
              <Text className="text-slate-500 font-medium p-2">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
