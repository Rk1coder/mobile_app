import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkshop } from "@/contexts/WorkshopContext";
import Colors from "@/constants/colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

function ActiveMemberCard({ userId }: { userId: string }) {
  const { getUserById } = useAuth();
  const { sessions, checkOut } = useWorkshop();
  const member = getUserById(userId);
  const session = sessions.find((s) => s.userId === userId && !s.checkOutTime);

  const getElapsed = () => {
    if (!session) return "0 dk";
    const diff = Date.now() - new Date(session.checkInTime).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hrs > 0) return `${hrs}s ${remainMins}dk`;
    return `${mins} dk`;
  };

  if (!member) return null;

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.memberCard}>
      <View style={styles.memberCardLeft}>
        <View style={styles.memberAvatarWrap}>
          {member.photoUri ? (
            <Image source={{ uri: member.photoUri }} style={styles.memberAvatar} />
          ) : (
            <View style={styles.memberAvatarPlaceholder}>
              <Text style={styles.memberAvatarLetter}>
                {member.name[0]}{member.surname[0]}
              </Text>
            </View>
          )}
          <View style={styles.onlineDot} />
        </View>
        <View>
          <Text style={styles.memberName}>{member.name} {member.surname}</Text>
          <Text style={styles.memberCheckIn}>
            {session ? new Date(session.checkInTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : ""}
          </Text>
        </View>
      </View>
      <View style={styles.memberCardRight}>
        <View style={styles.elapsedBadge}>
          <Ionicons name="time-outline" size={12} color={Colors.cyan} />
          <Text style={styles.elapsedText}>{getElapsed()}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, users } = useAuth();
  const { activeSessions, checkIn, checkOut, isUserInWorkshop, getUserTotalHours, sessions } = useWorkshop();
  const [refreshing, setRefreshing] = React.useState(false);

  const isInWorkshop = user ? isUserInWorkshop(user.id) : false;
  const totalHours = user ? getUserTotalHours(user.id) : 0;

  const todaySessions = sessions.filter((s) => {
    const today = new Date().toDateString();
    return new Date(s.checkInTime).toDateString() === today;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleCheckInOut = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isInWorkshop) {
      await checkOut(user.id);
    } else {
      await checkIn(user.id);
    }
  };

  const topPad = insets.top + (Platform_isWeb() ? 67 : 0);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Image
            source={require("@/assets/images/goktürk-logo.jpg")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.push("/nfc-checkin")}
            style={styles.nfcBtn}
          >
            <MaterialCommunityIcons name="nfc" size={20} color={Colors.cyan} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />
        }
      >
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingLabel}>Hoş geldin,</Text>
            <Text style={styles.greetingName}>{user?.name} {user?.surname}</Text>
          </View>
          <View style={[styles.roleBadge, user?.role === "admin" && styles.roleBadgeAdmin]}>
            <Text style={[styles.roleText, user?.role === "admin" && styles.roleTextAdmin]}>
              {user?.role === "admin" ? "Yönetici" : "Üye"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleCheckInOut}
          style={({ pressed }) => [styles.checkInCard, isInWorkshop && styles.checkInCardActive, pressed && { opacity: 0.88 }]}
        >
          <View style={styles.checkInIcon}>
            <Ionicons
              name={isInWorkshop ? "log-out-outline" : "log-in-outline"}
              size={32}
              color={isInWorkshop ? Colors.success : Colors.cyan}
            />
          </View>
          <View style={styles.checkInInfo}>
            <Text style={styles.checkInTitle}>
              {isInWorkshop ? "Atölyedesin" : "Atölyeye Gir"}
            </Text>
            <Text style={styles.checkInSub}>
              {isInWorkshop ? "Çıkış yapmak için dokun" : "Giriş yapmak için dokun"}
            </Text>
          </View>
          <View style={[styles.statusDot, isInWorkshop && styles.statusDotActive]} />
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalHours}</Text>
            <Text style={styles.statLabel}>Toplam Saat</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todaySessions.length}</Text>
            <Text style={styles.statLabel}>Bugün Giriş</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeSessions.length}</Text>
            <Text style={styles.statLabel}>Şu An İçerde</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Atölyedekiler</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{activeSessions.length}</Text>
          </View>
        </View>

        {activeSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Şu an atölyede kimse yok</Text>
          </View>
        ) : (
          activeSessions.map((session) => (
            <ActiveMemberCard key={session.id} userId={session.userId} />
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bugün Gelenler</Text>
        </View>

        {todaySessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Bugün henüz kimse gelmedi</Text>
          </View>
        ) : (
          todaySessions.map((session) => {
            const member = users.find((u) => u.id === session.userId);
            if (!member) return null;
            const inTime = new Date(session.checkInTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
            const outTime = session.checkOutTime
              ? new Date(session.checkOutTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
              : null;
            return (
              <View key={session.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyAvatar}>
                    {member.photoUri ? (
                      <Image source={{ uri: member.photoUri }} style={styles.historyAvatarImg} />
                    ) : (
                      <Text style={styles.historyAvatarLetter}>{member.name[0]}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.historyName}>{member.name} {member.surname}</Text>
                    <Text style={styles.historyTime}>
                      {inTime}{outTime ? ` → ${outTime}` : " → Hâlâ içerde"}
                    </Text>
                  </View>
                </View>
                {session.durationMinutes && (
                  <Text style={styles.historyDuration}>
                    {Math.floor(session.durationMinutes / 60)}s {session.durationMinutes % 60}dk
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function Platform_isWeb() {
  const { Platform } = require("react-native");
  return Platform.OS === "web";
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerLogo: {
    width: 90,
    height: 50,
  },
  headerRight: {
    flexDirection: "row",
    gap: 10,
  },
  nfcBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greetingLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  greetingName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleBadgeAdmin: {
    borderColor: Colors.cyan,
    backgroundColor: "rgba(0,200,232,0.1)",
  },
  roleText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  roleTextAdmin: {
    color: Colors.cyan,
  },
  checkInCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 14,
  },
  checkInCardActive: {
    borderColor: Colors.success,
    backgroundColor: "rgba(0,232,122,0.05)",
  },
  checkInIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  checkInInfo: {
    flex: 1,
  },
  checkInTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  checkInSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.textMuted,
  },
  statusDotActive: {
    backgroundColor: Colors.success,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.cyan,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.cyan,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberCardRight: {},
  memberAvatarWrap: {
    position: "relative",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cyan,
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarLetter: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.cyan,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  memberName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  memberCheckIn: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  elapsedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,200,232,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,200,232,0.2)",
  },
  elapsedText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.cyan,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  historyAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  historyAvatarLetter: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  historyName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  historyTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyDuration: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
});
