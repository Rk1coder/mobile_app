import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

export type UserRole = "admin" | "member";

export interface AppUser {
  id: string;
  name: string;
  surname: string;
  username: string;
  password: string;
  role: UserRole;
  photoUri?: string;
  phone?: string;
  cardIds: string[];
  approved: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: AppUser | null;
  users: AppUser[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<void>;
  addUser: (user: AppUser) => Promise<void>;
  updateUser: (userId: string, updates: Partial<AppUser>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserById: (userId: string) => AppUser | undefined;
  changeAdminPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = "goktürk_users";
const SESSION_KEY = "goktürk_session";

const DEFAULT_ADMIN: AppUser = {
  id: "admin-001",
  name: "Yönetici",
  surname: "GÖKTÜRK",
  username: "admin",
  password: "goktürk2024",
  role: "admin",
  cardIds: [],
  approved: true,
  createdAt: new Date().toISOString(),
};

const DEFAULT_MEMBERS: AppUser[] = [
  {
    id: "member-001",
    name: "Ahmet",
    surname: "Yılmaz",
    username: "ahmet",
    password: "123456",
    role: "member",
    cardIds: ["CARD-A1B2"],
    approved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "member-002",
    name: "Zeynep",
    surname: "Kaya",
    username: "zeynep",
    password: "123456",
    role: "member",
    cardIds: ["CARD-C3D4"],
    approved: true,
    createdAt: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem(USERS_KEY);
      let allUsers: AppUser[];
      if (!storedUsers) {
        allUsers = [DEFAULT_ADMIN, ...DEFAULT_MEMBERS];
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
      } else {
        allUsers = JSON.parse(storedUsers);
        const hasAdmin = allUsers.find((u) => u.role === "admin");
        if (!hasAdmin) {
          allUsers = [DEFAULT_ADMIN, ...allUsers];
          await AsyncStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
        }
      }
      setUsers(allUsers);

      const sessionId = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionId) {
        const sessionUser = allUsers.find((u) => u.id === sessionId);
        if (sessionUser) {
          setUser(sessionUser);
        }
      }
    } catch (e) {
      console.error("initializeData error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUsers = async (updated: AppUser[]) => {
    setUsers(updated);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const found = users.find(
        (u) =>
          u.username.toLowerCase() === username.toLowerCase() &&
          u.password === password &&
          u.approved
      );
      if (found) {
        setUser(found);
        await AsyncStorage.setItem(SESSION_KEY, found.id);
        return true;
      }
      return false;
    },
    [users]
  );

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<AppUser>) => {
      if (!user) return;
      const updated = users.map((u) =>
        u.id === user.id ? { ...u, ...updates } : u
      );
      const newUser = { ...user, ...updates };
      setUser(newUser);
      await saveUsers(updated);
    },
    [user, users]
  );

  const addUser = useCallback(
    async (newUser: AppUser) => {
      const updated = [...users, newUser];
      await saveUsers(updated);
    },
    [users]
  );

  const updateUser = useCallback(
    async (userId: string, updates: Partial<AppUser>) => {
      const updated = users.map((u) =>
        u.id === userId ? { ...u, ...updates } : u
      );
      if (user?.id === userId) {
        setUser((prev) => (prev ? { ...prev, ...updates } : prev));
      }
      await saveUsers(updated);
    },
    [users, user]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      const updated = users.filter((u) => u.id !== userId);
      await saveUsers(updated);
    },
    [users]
  );

  const getUserById = useCallback(
    (userId: string) => users.find((u) => u.id === userId),
    [users]
  );

  const changeAdminPassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<boolean> => {
      if (!user || user.role !== "admin") return false;
      if (user.password !== oldPassword) return false;
      const updated = users.map((u) =>
        u.id === user.id ? { ...u, password: newPassword } : u
      );
      const newUser = { ...user, password: newPassword };
      setUser(newUser);
      await saveUsers(updated);
      return true;
    },
    [user, users]
  );

  const value = useMemo(
    () => ({
      user,
      users,
      isLoading,
      login,
      logout,
      updateProfile,
      addUser,
      updateUser,
      deleteUser,
      getUserById,
      changeAdminPassword,
    }),
    [
      user,
      users,
      isLoading,
      login,
      logout,
      updateProfile,
      addUser,
      updateUser,
      deleteUser,
      getUserById,
      changeAdminPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
