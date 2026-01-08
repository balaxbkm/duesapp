const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Scheduled function to send reminders for loans matching criteria.
 * Runs every 24 hours.
 */
exports.sendDueReminders = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
    const db = admin.firestore();
    const messaging = admin.messaging();

    // Normalize "Today" to midnight for comparison
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Remind on due date (0), 1 day before, and 3 days before
    const reminders = [0, 1, 3];

    console.log("Starting reminder check...");

    try {
        const activeLoansSnapshot = await db.collection("loans").where("status", "==", "active").get();

        const sendPromises = activeLoansSnapshot.docs.map(async (doc) => {
            const loan = doc.data();

            // Skip if no due date set
            if (!loan.next_due_date) return;

            const dueDate = loan.next_due_date.toDate();
            const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

            // Calculate difference in days: (Due - Today)
            const diffTime = dueDay.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (reminders.includes(diffDays)) {
                console.log(`Loan ${doc.id} is due in ${diffDays} days.`);

                // Fetch user to get FCM token
                // Assuming user document has 'fcmToken' field
                const userDoc = await db.collection("users").doc(loan.user_id).get();
                if (!userDoc.exists) return;

                const userData = userDoc.data();
                if (!userData.fcmToken) return;

                let title = "";
                let body = "";

                if (loan.loan_type === 'i_owe') {
                    title = diffDays === 0 ? "⚠️ Payment Due Today!" : `Upcoming Payment in ${diffDays} Days`;
                    body = `You need to pay ${loan.emi_amount} to ${loan.title}.`;
                } else {
                    title = diffDays === 0 ? "💰 Collection Due Today!" : `Collection Expected in ${diffDays} Days`;
                    body = `You are owed ${loan.emi_amount} from ${loan.title}.`;
                }

                const message = {
                    notification: { title, body },
                    token: userData.fcmToken,
                    data: { loanId: doc.id }
                };

                try {
                    await messaging.send(message);
                    console.log(`Sent reminder for loan ${doc.id}`);
                } catch (e) {
                    console.error(`Error sending message to ${loan.user_id}`, e);
                }
            }
        });

        await Promise.all(sendPromises);
        console.log("Reminder check complete.");

    } catch (error) {
        console.error("Error in sendDueReminders:", error);
    }
});
