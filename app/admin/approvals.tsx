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
import { useWorkshop } from "@/contexts/WorkshopContext";
import Colors from "@/constants/colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function ApprovalsScreen() {
  const insets = useSafeAreaInsets();
  const { users, updateUser } = useAuth();
  const { pendingCards, approvePendingCard, rejectPendingCard, addNotification } = useWorkshop();
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newMemberName, setNewMemberName] = useState("");

  const members = users.filter((u) => u.role === "member" && u.approved);

  const handleApprove = async (cardId: string, cardDbId: string) => {
    if (!selectedUserId && !newMemberName.trim()) {
      Alert.alert("Hata", "Bir üye seçin veya yeni üye adı girin");
      return;
    }

    let targetUserId = selectedUserId;

    if (!selectedUserId && newMemberName.trim()) {
      const parts = newMemberName.trim().split(" ");
      const name = parts[0] ?? "Yeni";
      const surname = parts.slice(1).join(" ") || "Üye";
      const newUser = {
        id: Date.now().toString(),
        name,
        surname,
        username: name.toLowerCase() + Date.now().toString().slice(-4),
        password: "123456",
        role: "member" as const,
        cardIds: [cardId],
        approved: true,
        createdAt: new Date().toISOString(),
      };
      const { addUser } = require("@/contexts/AuthContext");
      targetUserId = newUser.id;
    }

    if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        await updateUser(selectedUserId, {
          cardIds: [...user.cardIds, cardId],
        });
      }
    }

    await approvePendingCard(cardDbId, targetUserId);
    await addNotification({
      id: Date.now().toString(),
      userId: targetUserId,
      title: "Kart Onaylandı",
      body: `'${cardId}' kartınız atölye sistemine eklendi.`,
      type: "approval",
      read: false,
      createdAt: new Date().toISOString(),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAssignModal(null);
    setSelectedUserId("");
    setNewMemberName("");
  };

  const handleReject = (cardDbId: string, cardId: string) => {
    Alert.alert("Kartı Reddet", `'${cardId}' kartını reddetmek istiyor musunuz?`, [
      { text: "İptal", style: "cancel" },
      {
        text: "Reddet",
        style: "destructive",
        onPress: async () => {
          await rejectPendingCard(cardDbId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Kart Onayları</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {pendingCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={56} color={Colors.success} />
            <Text style={styles.emptyTitle}>Onay Beklemiyor</Text>
            <Text style={styles.emptyText}>Tüm kart istekleri işlendi</Text>
          </View>
        ) : (
          pendingCards.map((card) => (
            <View key={card.id} style={styles.cardItem}>
              <View style={styles.cardTop}>
                <View style={styles.cardIconWrap}>
                  <MaterialCommunityIcons name="nfc" size={24} color={Colors.cyan} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardId}>{card.cardId}</Text>
                  <Text style={styles.cardTime}>
                    {new Date(card.requestedAt).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>

              {assignModal === card.id ? (
                <View style={styles.assignSection}>
                  <Text style={styles.assignTitle}>Üyeye Ata</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll}>
                    {members.map((m) => (
                      <Pressable
                        key={m.id}
                        onPress={() => setSelectedUserId(m.id === selectedUserId ? "" : m.id)}
                        style={[
                          styles.memberChip,
                          m.id === selectedUserId && styles.memberChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.memberChipText,
                            m.id === selectedUserId && styles.memberChipTextSelected,
                          ]}
                        >
                          {m.name} {m.surname}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Text style={styles.orLabel}>veya yeni üye oluştur</Text>
                  <TextInput
                    style={styles.newMemberInput}
                    placeholder="İsim Soyisim"
                    placeholderTextColor={Colors.textMuted}
                    value={newMemberName}
                    onChangeText={setNewMemberName}
                  />
                  <View style={styles.assignActions}>
                    <Pressable
                      onPress={() => {
                        setAssignModal(null);
                        setSelectedUserId("");
                        setNewMemberName("");
                      }}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelText}>İptal</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleApprove(card.cardId, card.id)}
                      style={styles.confirmBtn}
                    >
                      <Ionicons name="checkmark" size={16} color="#000" />
                      <Text style={styles.confirmText}>Onayla</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => handleReject(card.id, card.cardId)}
                    style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.7 }]}
                  >
                    <Ionicons name="close" size={18} color={Colors.danger} />
                    <Text style={styles.rejectText}>Reddet</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAssignModal(card.id)}
                    style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="checkmark" size={18} color="#000" />
                    <Text style={styles.approveText}>Onayla</Text>
                  </Pressable>
                </View>
              )}
            </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  cardItem: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(0,200,232,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,200,232,0.2)",
  },
  cardInfo: {
    flex: 1,
  },
  cardId: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  cardTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,56,92,0.1)",
    borderRadius: 10,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(255,56,92,0.3)",
  },
  rejectText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.danger,
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.cyan,
    borderRadius: 10,
    height: 44,
  },
  approveText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  assignSection: {
    gap: 10,
  },
  assignTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  memberScroll: {
    flexGrow: 0,
  },
  memberChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  memberChipSelected: {
    borderColor: Colors.cyan,
    backgroundColor: "rgba(0,200,232,0.12)",
  },
  memberChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  memberChipTextSelected: {
    color: Colors.cyan,
  },
  orLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
  newMemberInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  assignActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  confirmText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
});
