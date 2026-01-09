import { useEffect, useState } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/AuthContext';

const useFcmToken = () => {
    const { user } = useAuth();
    const [token, setToken] = useState('');
    const [notificationPermissionStatus, setNotificationPermissionStatus] = useState('');

    useEffect(() => {
        const retrieveToken = async () => {
            try {
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                    // Request permission
                    const permission = await Notification.requestPermission();
                    setNotificationPermissionStatus(permission);

                    if (permission === 'granted') {
                        if (!messaging) return;

                        // Get Token
                        // Replace 'YOUR_VAPID_KEY' with your actual VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Configuration
                        const currentToken = await getToken(messaging, {
                            vapidKey: 'BM_YOUR_VAPID_KEY_HERE_IF_NEEDED_OR_REMOVE_THIS_OPTION'
                        });

                        if (currentToken) {
                            setToken(currentToken);
                            // Save token to Firestore if user is logged in
                            if (user) {
                                const tokenRef = doc(db, 'users', user.uid, 'fcmTokens', currentToken);
                                await setDoc(tokenRef, {
                                    token: currentToken,
                                    createdAt: Date.now(),
                                    platform: 'web'
                                });
                            }
                        } else {
                            console.log('No registration token available. Request permission to generate one.');
                        }
                    }
                }
            } catch (error) {
                console.log('An error occurred while retrieving token:', error);
            }
        };

        if (user) {
            retrieveToken();
        }
    }, [user]);

    return { token, notificationPermissionStatus };
};

export default useFcmToken;
