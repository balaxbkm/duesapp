"use client";
import { createContext, useContext } from "react";
import { User } from "firebase/auth";

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
    refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);
