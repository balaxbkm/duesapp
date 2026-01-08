import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, writeBatch, addDoc } from 'firebase/firestore';
import { Notification } from '@/types';

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        return notifications.sort((a, b) => b.time - a.time);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

export const markAsRead = async (notificationId: string) => {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
};

export const markAllAsRead = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('read', '==', false)
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
    }
};

export const createNotification = async (notification: Omit<Notification, 'id'>) => {
    try {
        await addDoc(collection(db, 'notifications'), notification);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
