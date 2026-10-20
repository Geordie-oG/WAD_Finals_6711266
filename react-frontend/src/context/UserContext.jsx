/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { api } from "../lib/api";
export const UserContext = createContext(null);
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api("/auth/me")
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        sessionStorage.removeItem("course-token");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function login(identifier, password) {
    const data = await api("/auth/login", {
      method: "POST",
      body: { identifier, password },
    });
    sessionStorage.setItem("course-token", data.token);
    setUser(data.user);
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      sessionStorage.removeItem("course-token");
      setUser(null);
    }
  }
  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
