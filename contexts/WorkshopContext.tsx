import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface WorkshopSession {
  id: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
}

export interface PendingCard {
  id: string;
  cardId: string;
  requestedAt: string;
  requestedByName?: string;
}

export interface Competition {
  id: string;
  name: string;
  description: string;
  date: string;
  location?: string;
  category: string;
  status: "upcoming" | "ongoing" | "completed";
  projectName?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "checkin" | "checkout" | "competition" | "approval" | "general";
  read: boolean;
  createdAt: string;
}

interface WorkshopContextValue {
  sessions: WorkshopSession[];
  activeSessions: WorkshopSession[];
  pendingCards: PendingCard[];
  competitions: Competition[];
  notifications: Notification[];
  checkIn: (userId: string, cardId?: string) => Promise<void>;
  checkOut: (userId: string) => Promise<void>;
  isUserInWorkshop: (userId: string) => boolean;
  getUserSessionToday: (userId: string) => WorkshopSession | undefined;
  getUserTotalHours: (userId: string) => number;
  addPendingCard: (card: PendingCard) => Promise<void>;
  approvePendingCard: (cardId: string, userId: string) => Promise<void>;
  rejectPendingCard: (cardId: string) => Promise<void>;
  addCompetition: (comp: Competition) => Promise<void>;
  updateCompetition: (id: string, updates: Partial<Competition>) => Promise<void>;
  deleteCompetition: (id: string) => Promise<void>;
  addNotification: (notif: Notification) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;
  getUnreadCount: (userId: string) => number;
}

const WorkshopContext = createContext<WorkshopContextValue | null>(null);

const SESSIONS_KEY = "goktürk_sessions";
const PENDING_CARDS_KEY = "goktürk_pending_cards";
const COMPETITIONS_KEY = "goktürk_competitions";
const NOTIFICATIONS_KEY = "goktürk_notifications";

const DEFAULT_COMPETITIONS: Competition[] = [
  {
    id: "comp-001",
    name: "TÜBİTAK 2204-A",
    description: "Lise öğrencileri araştırma projeleri yarışması",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Ankara",
    category: "Bilim",
    status: "upcoming",
    projectName: "Güneş Enerjili Sulama Sistemi",
  },
  {
    id: "comp-002",
    name: "TEKNOFEST Robotik",
    description: "Otonom robotlar kategorisi savaş arenası",
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    location: "İstanbul",
    category: "Robotik",
    status: "upcoming",
    projectName: "GÖKTÜRK-BOT",
  },
  {
    id: "comp-003",
    name: "İHA Yarışması",
    description: "Özerk insansız hava aracı yarışması",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: "İzmir",
    category: "Havacılık",
    status: "completed",
  },
];

export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<WorkshopSession[]>([]);
  const [pendingCards, setPendingCards] = useState<PendingCard[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, p, c, n] = await Promise.all([
        AsyncStorage.getItem(SESSIONS_KEY),
        AsyncStorage.getItem(PENDING_CARDS_KEY),
        AsyncStorage.getItem(COMPETITIONS_KEY),
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
      ]);
      if (s) setSessions(JSON.parse(s));
      if (p) setPendingCards(JSON.parse(p));
      if (c) {
        setCompetitions(JSON.parse(c));
      } else {
        setCompetitions(DEFAULT_COMPETITIONS);
        await AsyncStorage.setItem(COMPETITIONS_KEY, JSON.stringify(DEFAULT_COMPETITIONS));
      }
      if (n) setNotifications(JSON.parse(n));
    } catch (e) {
      console.error("loadData error:", e);
    }
  };

  const saveSessions = async (updated: WorkshopSession[]) => {
    setSessions(updated);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  };

  const savePendingCards = async (updated: PendingCard[]) => {
    setPendingCards(updated);
    await AsyncStorage.setItem(PENDING_CARDS_KEY, JSON.stringify(updated));
  };

  const saveCompetitions = async (updated: Competition[]) => {
    setCompetitions(updated);
    await AsyncStorage.setItem(COMPETITIONS_KEY, JSON.stringify(updated));
  };

  const saveNotifications = async (updated: Notification[]) => {
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  };

  const activeSessions = useMemo(
    () => sessions.filter((s) => !s.checkOutTime),
    [sessions]
  );

  const isUserInWorkshop = useCallback(
    (userId: string) => activeSessions.some((s) => s.userId === userId),
    [activeSessions]
  );

  const getUserSessionToday = useCallback(
    (userId: string) => {
      const today = new Date().toDateString();
      return sessions.find(
        (s) =>
          s.userId === userId &&
          new Date(s.checkInTime).toDateString() === today &&
          !s.checkOutTime
      );
    },
    [sessions]
  );

  const getUserTotalHours = useCallback(
    (userId: string) => {
      const userSessions = sessions.filter(
        (s) => s.userId === userId && s.durationMinutes
      );
      const totalMinutes = userSessions.reduce(
        (acc, s) => acc + (s.durationMinutes ?? 0),
        0
      );
      return Math.round(totalMinutes / 60);
    },
    [sessions]
  );

  const checkIn = useCallback(
    async (userId: string, cardId?: string) => {
      const existing = activeSessions.find((s) => s.userId === userId);
      if (existing) return;

      const session: WorkshopSession = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        userId,
        checkInTime: new Date().toISOString(),
      };
      await saveSessions([...sessions, session]);
    },
    [sessions, activeSessions]
  );

  const checkOut = useCallback(
    async (userId: string) => {
      const checkOutTime = new Date().toISOString();
      const updated = sessions.map((s) => {
        if (s.userId === userId && !s.checkOutTime) {
          const inTime = new Date(s.checkInTime).getTime();
          const outTime = new Date(checkOutTime).getTime();
          const durationMinutes = Math.floor((outTime - inTime) / 60000);
          return { ...s, checkOutTime, durationMinutes };
        }
        return s;
      });
      await saveSessions(updated);
    },
    [sessions]
  );

  const addPendingCard = useCallback(
    async (card: PendingCard) => {
      const updated = [...pendingCards, card];
      await savePendingCards(updated);
    },
    [pendingCards]
  );

  const approvePendingCard = useCallback(
    async (cardId: string, userId: string) => {
      const updated = pendingCards.filter((c) => c.id !== cardId);
      await savePendingCards(updated);
    },
    [pendingCards]
  );

  const rejectPendingCard = useCallback(
    async (cardId: string) => {
      const updated = pendingCards.filter((c) => c.id !== cardId);
      await savePendingCards(updated);
    },
    [pendingCards]
  );

  const addCompetition = useCallback(
    async (comp: Competition) => {
      const updated = [...competitions, comp];
      await saveCompetitions(updated);
    },
    [competitions]
  );

  const updateCompetition = useCallback(
    async (id: string, updates: Partial<Competition>) => {
      const updated = competitions.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      await saveCompetitions(updated);
    },
    [competitions]
  );

  const deleteCompetition = useCallback(
    async (id: string) => {
      const updated = competitions.filter((c) => c.id !== id);
      await saveCompetitions(updated);
    },
    [competitions]
  );

  const addNotification = useCallback(
    async (notif: Notification) => {
      const updated = [notif, ...notifications];
      await saveNotifications(updated);
    },
    [notifications]
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      await saveNotifications(updated);
    },
    [notifications]
  );

  const markAllNotificationsRead = useCallback(
    async (userId: string) => {
      const updated = notifications.map((n) =>
        n.userId === userId || n.userId === "all" ? { ...n, read: true } : n
      );
      await saveNotifications(updated);
    },
    [notifications]
  );

  const getUnreadCount = useCallback(
    (userId: string) =>
      notifications.filter(
        (n) => (n.userId === userId || n.userId === "all") && !n.read
      ).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      sessions,
      activeSessions,
      pendingCards,
      competitions,
      notifications,
      checkIn,
      checkOut,
      isUserInWorkshop,
      getUserSessionToday,
      getUserTotalHours,
      addPendingCard,
      approvePendingCard,
      rejectPendingCard,
      addCompetition,
      updateCompetition,
      deleteCompetition,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      getUnreadCount,
    }),
    [
      sessions,
      activeSessions,
      pendingCards,
      competitions,
      notifications,
      checkIn,
      checkOut,
      isUserInWorkshop,
      getUserSessionToday,
      getUserTotalHours,
      addPendingCard,
      approvePendingCard,
      rejectPendingCard,
      addCompetition,
      updateCompetition,
      deleteCompetition,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      getUnreadCount,
    ]
  );

  return (
    <WorkshopContext.Provider value={value}>
      {children}
    </WorkshopContext.Provider>
  );
}

export function useWorkshop() {
  const ctx = useContext(WorkshopContext);
  if (!ctx) throw new Error("useWorkshop must be used within WorkshopProvider");
  return ctx;
}
