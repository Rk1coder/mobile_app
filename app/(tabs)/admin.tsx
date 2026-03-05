import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkshop } from "@/contexts/WorkshopContext";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { user, users } = useAuth();
  const { pendingCards, activeSessions, sessions } = useWorkshop();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (user?.role !== "admin") {
    return (
      <View style={[styles.root, { paddingTop: topPad, justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.noAccessText}>Erişim yetkiniz yok</Text>
      </View>
    );
  }

  const todaySessions = sessions.filter((s) => {
    const today = new Date().toDateString();
    return new Date(s.checkInTime).toDateString() === today;
  });
  const approvedMembers = users.filter((u) => u.role === "member" && u.approved);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yönetici Paneli</Text>
        <Image
          source={require("@/assets/images/goktürk-logo.jpg")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={Colors.cyan} />
            <Text style={styles.statNum}>{approvedMembers.length}</Text>
            <Text style={styles.statLbl}>Aktif Üye</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="business" size={24} color={Colors.success} />
            <Text style={styles.statNum}>{activeSessions.length}</Text>
            <Text style={styles.statLbl}>Atölyede</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="today" size={24} color={Colors.warning} />
            <Text style={styles.statNum}>{todaySessions.length}</Text>
            <Text style={styles.statLbl}>Bugün Giriş</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="card-outline" size={24} color={Colors.danger} />
            <Text style={styles.statNum}>{pendingCards.length}</Text>
            <Text style={styles.statLbl}>Onay Bekleyen</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Yönetim</Text>

        <Pressable
          onPress={() => router.push("/admin/approvals")}
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: "rgba(255,56,92,0.12)" }]}>
            <Ionicons name="card-outline" size={22} color={Colors.danger} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Kart Onayları</Text>
            <Text style={styles.menuSub}>Yeni kart kayıt isteklerini yönet</Text>
          </View>
          <View style={styles.menuRight}>
            {pendingCards.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCards.length}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push("/admin/members")}
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: "rgba(0,200,232,0.12)" }]}>
            <Ionicons name="people-outline" size={22} color={Colors.cyan} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Üye Yönetimi</Text>
            <Text style={styles.menuSub}>Üyeleri görüntüle ve yönet</Text>
          </View>
          <View style={styles.menuRight}>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push("/admin/settings")}
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: "rgba(139,92,246,0.12)" }]}>
            <Ionicons name="settings-outline" size={22} color="#8B5CF6" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Yönetici Ayarları</Text>
            <Text style={styles.menuSub}>Şifre değiştir ve sistem ayarları</Text>
          </View>
          <View style={styles.menuRight}>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </Pressable>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Atölyede Şu An</Text>

        {activeSessions.length === 0 ? (
          <View style={styles.emptyMini}>
            <Text style={styles.emptyMiniText}>Şu an kimse yok</Text>
          </View>
        ) : (
          activeSessions.map((s) => {
            const member = users.find((u) => u.id === s.userId);
            if (!member) return null;
            const inTime = new Date(s.checkInTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
            const elapsed = Math.floor((Date.now() - new Date(s.checkInTime).getTime()) / 60000);
            const hrs = Math.floor(elapsed / 60);
            const mins = elapsed % 60;
            return (
              <View key={s.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  {member.photoUri ? (
                    <Image source={{ uri: member.photoUri }} style={styles.memberAvatarImg} />
                  ) : (
                    <Text style={styles.memberAvatarLetter}>{member.name[0]}{member.surname[0]}</Text>
                  )}
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name} {member.surname}</Text>
                  <Text style={styles.memberTime}>Giriş: {inTime}</Text>
                </View>
                <View style={styles.elapsedBadge}>
                  <Text style={styles.elapsedText}>
                    {hrs > 0 ? `${hrs}s ${mins}dk` : `${mins} dk`}
                  </Text>
                </View>
              </View>
            );
          })
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
  noAccessText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    marginTop: 12,
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
  headerLogo: {
    width: 80,
    height: 44,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  statNum: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  statLbl: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  menuSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  emptyMini: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyMiniText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  memberAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarLetter: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.cyan,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  memberTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  elapsedBadge: {
    backgroundColor: "rgba(0,200,232,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  elapsedText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.cyan,
  },
});
