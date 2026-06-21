import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("employee_tracker_token"));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("employee_tracker_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [initializing, setInitializing] = useState(Boolean(token));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem("employee_tracker_token", token);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem("employee_tracker_token");
    }
  }, [token]);

  useEffect(() => {
    // When an authenticated request comes back 401 (e.g. an expired or
    // invalidated JWT), clear the session so the app redirects to sign-in
    // instead of leaving the user on a screen that only shows "Unable to
    // load data". The `token` guard avoids logging out on the login request
    // itself, which legitimately returns 401 for bad credentials.
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          setToken(null);
          setUser(null);
          localStorage.removeItem("employee_tracker_user");
        }
        return Promise.reject(error);
      },
    );
    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [token]);

  useEffect(() => {
    let mounted = true;
    async function hydrateUser() {
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const response = await api.get("/auth/me");
        if (mounted) {
          setUser(response.data);
          localStorage.setItem("employee_tracker_user", JSON.stringify(response.data));
        }
      } catch {
        if (mounted) {
          setToken(null);
          setUser(null);
          localStorage.removeItem("employee_tracker_user");
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    }
    hydrateUser();
    return () => {
      mounted = false;
    };
  }, [token]);

  async function login(username, password) {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);
    const response = await api.post("/auth/login", body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    setToken(response.data.access_token);
    setUser(response.data.user);
    localStorage.setItem("employee_tracker_user", JSON.stringify(response.data.user));
    return response.data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("employee_tracker_user");
  }

  const value = useMemo(
    () => ({
      apiBaseUrl: API_BASE_URL,
      initializing,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      token,
      user,
    }),
    [initializing, token, user],
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
