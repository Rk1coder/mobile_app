import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkshop } from "@/contexts/WorkshopContext";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateProfile, logout } = useAuth();
  const { getUserTotalHours, sessions } = useWorkshop();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [surname, setSurname] = useState(user?.surname ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const totalHours = user ? getUserTotalHours(user.id) : 0;
  const mySessions = sessions.filter((s) => s.userId === user?.id);
  const todaySession = mySessions.find(
    (s) => new Date(s.checkInTime).toDateString() === new Date().toDateString()
  );
  const totalSessions = mySessions.length;

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Fotoğraf seçmek için galeri erişimine izin verin.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile({ photoUri: result.assets[0].uri });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const saveProfile = async () => {
    if (!name.trim() || !surname.trim()) {
      Alert.alert("Hata", "İsim ve soyisim boş bırakılamaz");
      return;
    }
    await updateProfile({ name: name.trim(), surname: surname.trim(), phone: phone.trim() });
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLogout = () => {
    Alert.alert("Çıkış", "Çıkış yapmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <Pressable
          onPress={() => {
            if (editing) {
              setName(user?.name ?? "");
              setSurname(user?.surname ?? "");
              setPhone(user?.phone ?? "");
            }
            setEditing(!editing);
          }}
          style={styles.editBtn}
        >
          <Ionicons
            name={editing ? "close-outline" : "pencil-outline"}
            size={20}
            color={Colors.cyan}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.avatarSection}>
          <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {user?.name[0]}{user?.surname[0]}
                </Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>
          {!editing ? (
            <>
              <Text style={styles.profileName}>{user?.name} {user?.surname}</Text>
              <Text style={styles.profileUsername}>@{user?.username}</Text>
              <View style={[styles.rolePill, user?.role === "admin" && styles.rolePillAdmin]}>
                <Text style={[styles.rolePillText, user?.role === "admin" && styles.rolePillTextAdmin]}>
                  {user?.role === "admin" ? "Yönetici" : "Üye"}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.editingLabel}>Profili Düzenle</Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalHours}</Text>
            <Text style={styles.statLbl}>Saat</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalSessions}</Text>
            <Text style={styles.statLbl}>Ziyaret</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{user?.cardIds.length ?? 0}</Text>
            <Text style={styles.statLbl}>Kart</Text>
          </View>
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.fieldLabel}>İsim</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="İsim"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <Text style={styles.fieldLabel}>Soyisim</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={surname}
                onChangeText={setSurname}
                placeholder="Soyisim"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <Text style={styles.fieldLabel}>Telefon</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="0 5xx xxx xx xx"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            <Pressable
              onPress={saveProfile}
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="checkmark" size={18} color="#000" />
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.infoLabel}>Kullanıcı Adı</Text>
              <Text style={styles.infoValue}>@{user?.username}</Text>
            </View>
            {user?.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.infoLabel}>Kayıtlı Kartlar</Text>
              <Text style={styles.infoValue}>{user?.cardIds.length ?? 0} kart</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.infoLabel}>Kayıt Tarihi</Text>
              <Text style={styles.infoValue}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("tr-TR")
                  : "-"}
              </Text>
            </View>
          </View>
        )}

        {todaySession && !editing && (
          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <Ionicons name="today-outline" size={16} color={Colors.cyan} />
              <Text style={styles.todayTitle}>Bugünkü Oturum</Text>
            </View>
            <Text style={styles.todayInfo}>
              Giriş: {new Date(todaySession.checkInTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              {todaySession.checkOutTime
                ? `  Çıkış: ${new Date(todaySession.checkOutTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`
                : "  —  Hâlâ içeridesin"}
            </Text>
            {todaySession.durationMinutes && (
              <Text style={styles.todayDuration}>
                Süre: {Math.floor(todaySession.durationMinutes / 60)}s {todaySession.durationMinutes % 60}dk
              </Text>
            )}
          </View>
        )}

        {!editing && (
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,200,232,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,200,232,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 14,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.cyan,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.cyan,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.cyan,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cyan,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rolePillAdmin: {
    borderColor: Colors.cyan,
    backgroundColor: "rgba(0,200,232,0.1)",
  },
  rolePillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  rolePillTextAdmin: {
    color: Colors.cyan,
  },
  editingLabel: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.cyan,
  },
  statLbl: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  editForm: {
    gap: 0,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrap: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 50,
    justifyContent: "center",
  },
  input: {
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.cyan,
    borderRadius: 12,
    height: 50,
    marginTop: 20,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  infoSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  todayCard: {
    backgroundColor: "rgba(0,200,232,0.06)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,200,232,0.2)",
    marginBottom: 20,
    gap: 6,
  },
  todayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  todayTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.cyan,
  },
  todayInfo: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  todayDuration: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,56,92,0.1)",
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255,56,92,0.3)",
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.danger,
  },
});
