"use client";
import useFcmToken from "@/hooks/useFcmToken";
import { useEffect } from "react";

const FcmManager = () => {
    const { token, notificationPermissionStatus } = useFcmToken();

    useEffect(() => {
        if (token) {
            console.log("FCM Token retrieved:", token);
        }
    }, [token]);

    return null; // This component is logical only and renders nothing
};

export default FcmManager;
