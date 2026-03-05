import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef<TextInput>(null);
  const shakeX = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Kullanıcı adı ve şifre gereklidir");
      shakeX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-10, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsLoading(true);
    setError("");
    buttonScale.value = withSpring(0.96);

    const success = await login(username.trim(), password);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      buttonScale.value = withSpring(1);
      router.replace("/(tabs)");
    } else {
      setError("Kullanıcı adı veya şifre hatalı");
      shakeX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-10, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      buttonScale.value = withSpring(1);
    }
    setIsLoading(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.logoSection}>
          <Image
            source={require("@/assets/images/goktürk-logo.jpg")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>GÖKTÜRK</Text>
          <Text style={styles.appSubtitle}>Atölye Takip Sistemi</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(700).springify()}
          style={styles.formCard}
        >
          <Text style={styles.formTitle}>Giriş Yap</Text>

          <Animated.View style={shakeStyle}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Kullanıcı adı"
                placeholderTextColor={Colors.textMuted}
                value={username}
                onChangeText={(t) => { setUsername(t); setError(""); }}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="Şifre"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(""); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>

            {!!error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </Animated.View>

          <Animated.View style={buttonStyle}>
            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.85 }]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Giriş Yap</Text>
              )}
            </Pressable>
          </Animated.View>

          <View style={styles.hintRow}>
            <Text style={styles.hintText}>Admin: admin / goktürk2024</Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgDecor1: {
    position: "absolute",
    top: -60,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.cyan,
    opacity: 0.04,
  },
  bgDecor2: {
    position: "absolute",
    bottom: -40,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.cyan,
    opacity: 0.06,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 110,
    height: 70,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.cyan,
    letterSpacing: 4,
  },
  appSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  eyeBtn: {
    padding: 4,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  loginBtn: {
    backgroundColor: Colors.cyan,
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  hintRow: {
    marginTop: 16,
    alignItems: "center",
  },
  hintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
});
