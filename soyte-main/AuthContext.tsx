import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "./api"; // Correctly import the api object

// Define the shape of the user object
interface User {
  id: string;
  name: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  permissions: string[];
  unit: string;
}

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, loginUser?: any) => Promise<any>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Extract and attach permissions from the user object.
// Priority: permission_list → assignedRoles → API call to /roles/{roleId}
const enrichUserWithRolePermissions = async (user: any): Promise<any> => {
  // 1. Derive from assignedRoles if present
  if (Array.isArray(user.assignedRoles) && user.assignedRoles.length > 0) {
    const permissions: string[] = Array.from(
      new Set<string>(
        user.assignedRoles.flatMap((role: any) =>
          (role.permissions || []).map((p: any) =>
            typeof p === "string" ? p : p.name,
          ),
        ),
      ),
    );
    return { ...user, permissions };
  }

  // 2. Fallback to flat permission_list
  if (Array.isArray(user.permission_list) && user.permission_list.length > 0) {
    return { ...user, permissions: user.permission_list };
  }

  // 3. Fallback: fetch from /roles/{roleId}
  const roleId = user.role_id || user.assigned_role?.id || user.assignedRole?.id;
  if (!roleId) return user;
  try {
    const roleRes = await api.get(`/roles/${roleId}`);
    const role = roleRes.data || roleRes;
    const permissions: string[] = (role.permissions || []).map((p: any) =>
      typeof p === "string" ? p : p.name,
    );
    return { ...user, permissions };
  } catch {
    return user;
  }
};

// Create the provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          const storedUser = localStorage.getItem("user_info");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setLoading(false);
          }
          const response = await api.get("/auth/me");
          const baseUser = response.user;
          const enrichedUser = await enrichUserWithRolePermissions(baseUser);
          setUser(enrichedUser);
          localStorage.setItem("user_info", JSON.stringify(enrichedUser));
          if (enrichedUser.unit) {
            localStorage.setItem("unit_id", enrichedUser.unit);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        localStorage.removeItem("auth_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (token: string, loginUser?: any) => {
    localStorage.setItem("auth_token", token);
    setLoading(true);
    try {
      // If the login response already provides the user object, use it directly
      // to avoid a redundant /auth/me + /roles/{id} round-trip.
      const baseUser = loginUser ?? await api.get("/auth/me").then((r) => r.user || r.data || r);
      const enrichedUser = await enrichUserWithRolePermissions(baseUser);
      setUser(enrichedUser);
      localStorage.setItem("user_info", JSON.stringify(enrichedUser));
      if (enrichedUser.unit) {
        localStorage.setItem("unit_id", enrichedUser.unit);
      }
      return enrichedUser;
    } catch (error) {
      console.error("Failed to fetch user after login:", error);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_info");
    localStorage.removeItem("unit_id");
    setUser(null);
    window.location.href = "/login";
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy consumption of the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
