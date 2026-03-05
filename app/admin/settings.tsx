import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { changeAdminPassword } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Hata", "Tüm alanları doldurun");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Hata", "Yeni şifre en az 6 karakter olmalıdır");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Hata", "Yeni şifreler eşleşmiyor");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsLoading(true);
    const success = await changeAdminPassword(oldPassword, newPassword);
    setIsLoading(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Başarılı", "Şifreniz başarıyla güncellendi", [
        {
          text: "Tamam",
          onPress: () => {
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
          },
        },
      ]);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Hata", "Mevcut şifre hatalı");
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Yönetici Ayarları</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="lock-closed" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.cyan} />
            <Text style={styles.infoText}>
              Güçlü bir şifre belirleyin. En az 6 karakter kullanın.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Mevcut Şifre</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOld}
                placeholder="Mevcut şifrenizi girin"
                placeholderTextColor={Colors.textMuted}
              />
              <Pressable onPress={() => setShowOld(!showOld)} style={styles.eyeBtn}>
                <Ionicons
                  name={showOld ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Yeni Şifre</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                placeholder="Yeni şifrenizi girin"
                placeholderTextColor={Colors.textMuted}
              />
              <Pressable onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                <Ionicons
                  name={showNew ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Şifreyi Onayla</Text>
            <View style={[
              styles.inputWrap,
              confirmPassword && newPassword && confirmPassword !== newPassword
                ? styles.inputWrapError : {},
            ]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholder="Yeni şifreyi tekrar girin"
                placeholderTextColor={Colors.textMuted}
              />
              <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>
            {confirmPassword && newPassword !== confirmPassword && (
              <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
            )}
            {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && (
              <Text style={styles.successText}>Şifreler eşleşiyor</Text>
            )}
          </View>

          <Pressable
            onPress={handleChangePassword}
            disabled={isLoading}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, isLoading && { opacity: 0.6 }]}
          >
            <Ionicons name="save-outline" size={18} color="#000" />
            <Text style={styles.saveBtnText}>
              {isLoading ? "Kaydediliyor..." : "Şifreyi Güncelle"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Sistem Bilgisi</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versiyon</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Uygulama</Text>
            <Text style={styles.infoValue}>GÖKTÜRK Atölye Takip</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.card,
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  section: {
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  sectionIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(0,200,232,0.06)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,200,232,0.15)",
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapError: { borderColor: Colors.danger },
  input: { flex: 1, color: Colors.textPrimary, fontFamily: "Inter_400Regular", fontSize: 14 },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.danger, marginTop: 4 },
  successText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.success, marginTop: 4 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.cyan,
    borderRadius: 12, height: 50, marginTop: 4,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
  infoSection: {
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  infoSectionTitle: {
    fontSize: 14, fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary, marginBottom: 12,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.textPrimary },
});
