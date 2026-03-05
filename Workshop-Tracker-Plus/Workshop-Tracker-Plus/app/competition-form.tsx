import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useWorkshop } from "@/contexts/WorkshopContext";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const CATEGORIES = ["Bilim", "Robotik", "Havacılık", "Yazılım", "Tasarım", "Diğer"];

export default function CompetitionFormScreen() {
  const insets = useSafeAreaInsets();
  const { addCompetition, addNotification } = useWorkshop();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [projectName, setProjectName] = useState("");
  const [category, setCategory] = useState("Diğer");
  const [isLoading, setIsLoading] = useState(false);

  const parseDate = (input: string) => {
    const parts = input.split(".");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    }
    return null;
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !date.trim()) {
      Alert.alert("Hata", "İsim, açıklama ve tarih zorunludur");
      return;
    }
    const parsedDate = parseDate(date);
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      Alert.alert("Hata", "Tarih formatı: GG.AA.YYYY (örn: 15.06.2025)");
      return;
    }

    setIsLoading(true);
    const daysUntil = Math.floor((parsedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const comp = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      description: description.trim(),
      date: parsedDate.toISOString(),
      location: location.trim() || undefined,
      category,
      status: "upcoming" as const,
      projectName: projectName.trim() || undefined,
    };

    await addCompetition(comp);

    if (daysUntil <= 7 && daysUntil >= 0) {
      await addNotification({
        id: Date.now().toString(),
        userId: "all",
        title: "Yaklaşan Yarışma!",
        body: `${comp.name} yarışmasına ${daysUntil} gün kaldı!`,
        type: "competition",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(false);
    router.back();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yarışma Ekle</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Yarışma Adı *</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Örn: TÜBİTAK 2204-A"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Açıklama *</Text>
          <View style={[styles.inputWrap, styles.textAreaWrap]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Yarışma hakkında kısa açıklama..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tarih * (GG.AA.YYYY)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="15.06.2025"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Konum</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Şehir / İl"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Proje Adı</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="cube-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Katılım projesinin adı"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.categoryChip, category === cat && styles.categoryChipSelected]}
              >
                <Text
                  style={[styles.categoryChipText, category === cat && styles.categoryChipTextSelected]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={isLoading}
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, isLoading && { opacity: 0.6 }]}
        >
          <Ionicons name="trophy" size={18} color="#000" />
          <Text style={styles.saveBtnText}>
            {isLoading ? "Ekleniyor..." : "Yarışmayı Ekle"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.card,
    justifyContent: "center", alignItems: "center",
  },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 0 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 50,
  },
  textAreaWrap: { height: "auto" as any, paddingVertical: 12 },
  input: { flex: 1, color: Colors.textPrimary, fontFamily: "Inter_400Regular", fontSize: 15 },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  categoryChipSelected: { borderColor: Colors.cyan, backgroundColor: "rgba(0,200,232,0.1)" },
  categoryChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  categoryChipTextSelected: { color: Colors.cyan },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.cyan,
    borderRadius: 12, height: 52, marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
});
