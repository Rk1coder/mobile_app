import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkshop, Notification } from "@/contexts/WorkshopContext";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

const typeIcon: Record<string, { name: string; color: string }> = {
  checkin: { name: "log-in-outline", color: Colors.success },
  checkout: { name: "log-out-outline", color: Colors.textSecondary },
  competition: { name: "trophy-outline", color: Colors.warning },
  approval: { name: "shield-checkmark-outline", color: Colors.cyan },
  general: { name: "information-circle-outline", color: Colors.textSecondary },
};

function NotifCard({ notif, onRead }: { notif: Notification; onRead: () => void }) {
  const icon = typeIcon[notif.type] ?? typeIcon.general;
  const timeAgo = () => {
    const diff = Date.now() - new Date(notif.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dk önce`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} saat önce`;
    return `${Math.floor(hrs / 24)} gün önce`;
  };

  return (
    <Pressable
      onPress={onRead}
      style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
    >
      <View style={[styles.notifIconWrap, { borderColor: icon.color + "44" }]}>
        <Ionicons name={icon.name as any} size={22} color={icon.color} />
      </View>
      <View style={styles.notifContent}>
        <Text style={styles.notifTitle}>{notif.title}</Text>
        <Text style={styles.notifBody}>{notif.body}</Text>
        <Text style={styles.notifTime}>{timeAgo()}</Text>
      </View>
      {!notif.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useWorkshop();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const myNotifs = notifications.filter(
    (n) => n.userId === user?.id || n.userId === "all"
  );
  const unreadCount = myNotifs.filter((n) => !n.read).length;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {unreadCount > 0 && (
          <Pressable
            onPress={() => user && markAllNotificationsRead(user.id)}
            style={styles.markAllBtn}
          >
            <Text style={styles.markAllText}>Tümünü Okundu İşaretle</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {myNotifs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={50} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Bildirim Yok</Text>
            <Text style={styles.emptyText}>Henüz bir bildiriminiz bulunmuyor</Text>
          </View>
        ) : (
          myNotifs.map((notif) => (
            <NotifCard
              key={notif.id}
              notif={notif}
              onRead={() => markNotificationRead(notif.id)}
            />
          ))
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
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.card,
  },
  markAllText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.cyan,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  notifCardUnread: {
    borderColor: "rgba(0,200,232,0.25)",
    backgroundColor: "rgba(0,200,232,0.04)",
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cyan,
    marginTop: 4,
  },
});
