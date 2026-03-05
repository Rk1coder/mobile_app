import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkshop, Competition } from "@/contexts/WorkshopContext";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

const categoryColors: Record<string, string> = {
  Bilim: "#8B5CF6",
  Robotik: Colors.cyan,
  Havacılık: "#F59E0B",
  Yazılım: "#10B981",
  Tasarım: "#EC4899",
  Diğer: Colors.textSecondary,
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function CompetitionCard({ comp }: { comp: Competition }) {
  const days = daysUntil(comp.date);
  const catColor = categoryColors[comp.category] ?? Colors.textSecondary;
  const isUrgent = days >= 0 && days <= 7;

  const statusColor =
    comp.status === "upcoming"
      ? days <= 7
        ? Colors.warning
        : Colors.cyan
      : comp.status === "ongoing"
      ? Colors.success
      : Colors.textMuted;

  const statusLabel =
    comp.status === "upcoming"
      ? days < 0
        ? "Geçti"
        : `${days} gün kaldı`
      : comp.status === "ongoing"
      ? "Devam Ediyor"
      : "Tamamlandı";

  return (
    <View style={[styles.compCard, isUrgent && styles.compCardUrgent]}>
      {isUrgent && (
        <View style={styles.urgentBanner}>
          <Ionicons name="warning-outline" size={12} color={Colors.warning} />
          <Text style={styles.urgentText}>1 haftadan az kaldı!</Text>
        </View>
      )}
      <View style={styles.compTop}>
        <View style={[styles.categoryTag, { backgroundColor: catColor + "20", borderColor: catColor + "40" }]}>
          <Text style={[styles.categoryText, { color: catColor }]}>{comp.category}</Text>
        </View>
        <View style={[styles.statusTag, { backgroundColor: statusColor + "20" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <Text style={styles.compName}>{comp.name}</Text>
      <Text style={styles.compDesc}>{comp.description}</Text>
      {comp.projectName && (
        <View style={styles.projectRow}>
          <Ionicons name="cube-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.projectName}>{comp.projectName}</Text>
        </View>
      )}
      <View style={styles.compFooter}>
        <View style={styles.compInfoItem}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.compInfoText}>
            {new Date(comp.date).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        {comp.location && (
          <View style={styles.compInfoItem}>
            <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.compInfoText}>{comp.location}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function CompetitionsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { competitions } = useWorkshop();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const upcoming = useMemo(
    () =>
      competitions
        .filter((c) => c.status === "upcoming")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [competitions]
  );

  const completed = useMemo(
    () => competitions.filter((c) => c.status === "completed" || c.status === "ongoing"),
    [competitions]
  );

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yarışmalar</Text>
        {user?.role === "admin" && (
          <Pressable
            onPress={() => router.push("/competition-form")}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={22} color={Colors.cyan} />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <Text style={styles.sectionLabel}>Yaklaşan Yarışmalar</Text>
        {upcoming.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Yaklaşan yarışma yok</Text>
          </View>
        ) : (
          upcoming.map((comp) => <CompetitionCard key={comp.id} comp={comp} />)
        )}

        {completed.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Geçmiş</Text>
            {completed.map((comp) => <CompetitionCard key={comp.id} comp={comp} />)}
          </>
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
  addBtn: {
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  compCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  compCardUrgent: {
    borderColor: Colors.warning + "60",
  },
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.warning + "15",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  urgentText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.warning,
  },
  compTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  compName: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  compDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  projectName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  compFooter: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  compInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  compInfoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
});
