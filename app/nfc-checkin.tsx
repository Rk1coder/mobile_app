import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkshop } from "@/contexts/WorkshopContext";
import Colors from "@/constants/colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";

export default function NFCCheckinScreen() {
  const insets = useSafeAreaInsets();
  const { user, users, updateUser } = useAuth();
  const { checkIn, checkOut, isUserInWorkshop, addPendingCard, addNotification } = useWorkshop();
  const [cardId, setCardId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<"success" | "pending" | "error" | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const pulse = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulse.value,
  }));

  const startScan = () => {
    setIsScanning(true);
    setResult(null);
    pulse.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false
    );
  };

  const processCard = async (id: string) => {
    const trimId = id.trim().toUpperCase();
    if (!trimId) {
      Alert.alert("Hata", "Kart ID boş olamaz");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    pulse.value = withSpring(1);
    setIsScanning(false);

    const owner = users.find((u) => u.cardIds.includes(trimId) && u.approved);

    if (!owner) {
      setResult("pending");
      setResultMessage(`Kart '${trimId}' kayıtlı değil. Yönetici onayına gönderildi.`);
      await addPendingCard({
        id: Date.now().toString(),
        cardId: trimId,
        requestedAt: new Date().toISOString(),
        requestedByName: user?.name,
      });
      await addNotification({
        id: Date.now().toString() + "n",
        userId: "all",
        title: "Yeni Kart Okutma",
        body: `'${trimId}' ID'li bilinmeyen bir kart okutuldu. Onay gerekiyor.`,
        type: "approval",
        read: false,
        createdAt: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const alreadyIn = isUserInWorkshop(owner.id);
    if (alreadyIn) {
      await checkOut(owner.id);
      setResult("success");
      setResultMessage(`${owner.name} ${owner.surname} atölyeden çıkış yaptı.`);
      await addNotification({
        id: Date.now().toString() + "n",
        userId: owner.id,
        title: "Atölye Çıkışı",
        body: `${owner.name} ${owner.surname} atölyeden çıkış yaptı.`,
        type: "checkout",
        read: false,
        createdAt: new Date().toISOString(),
      });
    } else {
      await checkIn(owner.id, trimId);
      setResult("success");
      setResultMessage(`${owner.name} ${owner.surname} atölyeye giriş yaptı.`);
      await addNotification({
        id: Date.now().toString() + "n",
        userId: owner.id,
        title: "Atölye Girişi",
        body: `${owner.name} ${owner.surname} atölyeye giriş yaptı.`,
        type: "checkin",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCardId("");
  };

  const simulateCard = async (cardId: string) => {
    setCardId(cardId);
    await processCard(cardId);
  };

  const knownCards = users.flatMap((u) =>
    u.cardIds.map((c) => ({ cardId: c, name: `${u.name} ${u.surname}` }))
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NFC / Kart Okutma</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        <View style={styles.nfcArea}>
          <Animated.View style={[styles.nfcRing, isScanning && pulseStyle]}>
            <View style={styles.nfcInner}>
              <MaterialCommunityIcons
                name="nfc"
                size={56}
                color={isScanning ? Colors.cyan : Colors.textMuted}
              />
            </View>
          </Animated.View>
          <Text style={styles.nfcLabel}>
            {isScanning ? "Kart bekleniyor..." : "Kart ID gir veya simüle et"}
          </Text>
        </View>

        {result && (
          <View
            style={[
              styles.resultCard,
              result === "success" && styles.resultSuccess,
              result === "pending" && styles.resultPending,
              result === "error" && styles.resultError,
            ]}
          >
            <Ionicons
              name={
                result === "success"
                  ? "checkmark-circle"
                  : result === "pending"
                  ? "time"
                  : "close-circle"
              }
              size={26}
              color={
                result === "success"
                  ? Colors.success
                  : result === "pending"
                  ? Colors.warning
                  : Colors.danger
              }
            />
            <Text style={styles.resultText}>{resultMessage}</Text>
          </View>
        )}

        <View style={styles.manualSection}>
          <Text style={styles.manualLabel}>Manuel Kart ID</Text>
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              value={cardId}
              onChangeText={(t) => setCardId(t.toUpperCase())}
              placeholder="Örn: CARD-A1B2"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={() => processCard(cardId)}
            />
            <Pressable
              onPress={() => processCard(cardId)}
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </Pressable>
          </View>
        </View>

        <View style={styles.simSection}>
          <Text style={styles.simLabel}>Kayıtlı Kartlar (Simülasyon)</Text>
          {knownCards.map((kc) => (
            <Pressable
              key={kc.cardId}
              onPress={() => simulateCard(kc.cardId)}
              style={({ pressed }) => [styles.simCard, pressed && { opacity: 0.7 }]}
            >
              <MaterialCommunityIcons name="nfc" size={18} color={Colors.cyan} />
              <View style={styles.simInfo}>
                <Text style={styles.simName}>{kc.name}</Text>
                <Text style={styles.simCardId}>{kc.cardId}</Text>
              </View>
              <Ionicons name="play-circle-outline" size={22} color={Colors.textSecondary} />
            </Pressable>
          ))}
        </View>
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
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  nfcArea: {
    alignItems: "center",
    gap: 16,
  },
  nfcRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: Colors.cyan + "60",
    justifyContent: "center",
    alignItems: "center",
  },
  nfcInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  nfcLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: "rgba(0,232,122,0.08)",
    borderColor: Colors.success + "40",
  },
  resultPending: {
    backgroundColor: "rgba(255,184,0,0.08)",
    borderColor: Colors.warning + "40",
  },
  resultError: {
    backgroundColor: "rgba(255,56,92,0.08)",
    borderColor: Colors.danger + "40",
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  manualSection: {
    gap: 8,
  },
  manualLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  manualRow: {
    flexDirection: "row",
    gap: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 50,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  submitBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.cyan,
    justifyContent: "center",
    alignItems: "center",
  },
  simSection: {
    gap: 8,
  },
  simLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  simCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  simInfo: {
    flex: 1,
  },
  simName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  simCardId: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },
});
