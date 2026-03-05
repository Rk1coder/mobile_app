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
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkshop } from "@/contexts/WorkshopContext";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const { users, addUser, updateUser, deleteUser } = useAuth();
  const { isUserInWorkshop, getUserTotalHours } = useWorkshop();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSurname, setNewSurname] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const members = users.filter((u) => u.role === "member");

  const handleAddMember = async () => {
    if (!newName.trim() || !newSurname.trim() || !newUsername.trim() || !newPassword.trim()) {
      Alert.alert("Hata", "Tüm alanlar zorunludur");
      return;
    }
    const exists = users.find((u) => u.username.toLowerCase() === newUsername.toLowerCase());
    if (exists) {
      Alert.alert("Hata", "Bu kullanıcı adı zaten kullanımda");
      return;
    }
    const newUser = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: newName.trim(),
      surname: newSurname.trim(),
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim(),
      role: "member" as const,
      cardIds: [],
      approved: true,
      createdAt: new Date().toISOString(),
    };
    await addUser(newUser);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
    setNewName(""); setNewSurname(""); setNewUsername(""); setNewPassword("");
  };

  const handleDeleteMember = (userId: string, name: string) => {
    Alert.alert("Üyeyi Sil", `${name} adlı üyeyi silmek istediğinize emin misiniz?`, [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await deleteUser(userId);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  const handleToggleApprove = async (userId: string, approved: boolean) => {
    await updateUser(userId, { approved: !approved });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Üye Yönetimi</Text>
        <Pressable onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Ionicons name="person-add-outline" size={20} color={Colors.cyan} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Henüz üye yok</Text>
          </View>
        ) : (
          members.map((member) => {
            const inWorkshop = isUserInWorkshop(member.id);
            const totalHours = getUserTotalHours(member.id);
            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberTop}>
                  <View style={styles.avatarWrap}>
                    {member.photoUri ? (
                      <Image source={{ uri: member.photoUri }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarLetter}>{member.name[0]}{member.surname[0]}</Text>
                      </View>
                    )}
                    {inWorkshop && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name} {member.surname}</Text>
                    <Text style={styles.memberUsername}>@{member.username}</Text>
                    <View style={styles.memberMeta}>
                      <View style={[styles.statusTag, inWorkshop ? styles.statusOnline : styles.statusOff]}>
                        <Text style={[styles.statusText, inWorkshop ? styles.statusOnlineText : styles.statusOffText]}>
                          {inWorkshop ? "Atölyede" : "Dışarıda"}
                        </Text>
                      </View>
                      <Text style={styles.hoursText}>{totalHours}s toplam</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.memberDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="card-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.detailText}>{member.cardIds.length} kart</Text>
                  </View>
                  {member.phone && (
                    <View style={styles.detailItem}>
                      <Ionicons name="call-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.detailText}>{member.phone}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.memberActions}>
                  <Pressable
                    onPress={() => handleToggleApprove(member.id, member.approved)}
                    style={[styles.actionBtn, member.approved ? styles.approvedBtn : styles.pendingBtn]}
                  >
                    <Ionicons
                      name={member.approved ? "checkmark-circle" : "time"}
                      size={15}
                      color={member.approved ? Colors.success : Colors.warning}
                    />
                    <Text style={[styles.actionText, { color: member.approved ? Colors.success : Colors.warning }]}>
                      {member.approved ? "Onaylı" : "Askıya Al"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteMember(member.id, `${member.name} ${member.surname}`)}
                    style={[styles.actionBtn, styles.deleteBtn]}
                  >
                    <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                    <Text style={[styles.actionText, { color: Colors.danger }]}>Sil</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Yeni Üye Ekle</Text>

            {[
              { label: "İsim", value: newName, set: setNewName, placeholder: "İsim" },
              { label: "Soyisim", value: newSurname, set: setNewSurname, placeholder: "Soyisim" },
              { label: "Kullanıcı Adı", value: newUsername, set: setNewUsername, placeholder: "kullanici_adi" },
              { label: "Şifre", value: newPassword, set: setNewPassword, placeholder: "Şifre", secure: true },
            ].map((field) => (
              <View key={field.label} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={field.value}
                    onChangeText={field.set}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!!(field as any).secure}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}

            <Pressable
              onPress={handleAddMember}
              style={({ pressed }) => [styles.addMemberBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.addMemberBtnText}>Üye Ekle</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(0,200,232,0.1)",
    borderWidth: 1, borderColor: "rgba(0,200,232,0.3)",
    justifyContent: "center", alignItems: "center",
  },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  memberCard: {
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  memberTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatarWrap: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    justifyContent: "center", alignItems: "center",
  },
  avatarLetter: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.textSecondary },
  onlineDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.card,
  },
  memberInfo: { flex: 1, gap: 3 },
  memberName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary },
  memberUsername: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  memberMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusOnline: { backgroundColor: "rgba(0,232,122,0.12)" },
  statusOff: { backgroundColor: Colors.surface },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  statusOnlineText: { color: Colors.success },
  statusOffText: { color: Colors.textMuted },
  hoursText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  memberDetails: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  memberActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, borderRadius: 8, height: 36, borderWidth: 1,
  },
  approvedBtn: { backgroundColor: "rgba(0,232,122,0.08)", borderColor: "rgba(0,232,122,0.25)" },
  pendingBtn: { backgroundColor: "rgba(255,184,0,0.08)", borderColor: "rgba(255,184,0,0.25)" },
  deleteBtn: { backgroundColor: "rgba(255,56,92,0.08)", borderColor: "rgba(255,56,92,0.25)" },
  actionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 0,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: "center", marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.textPrimary, marginBottom: 16 },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, marginBottom: 6 },
  inputWrap: {
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, height: 46, justifyContent: "center",
  },
  input: { color: Colors.textPrimary, fontFamily: "Inter_400Regular", fontSize: 14 },
  addMemberBtn: {
    backgroundColor: Colors.cyan, borderRadius: 12, height: 50,
    justifyContent: "center", alignItems: "center", marginTop: 8,
  },
  addMemberBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
});
