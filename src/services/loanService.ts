import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    Timestamp,
    orderBy,
    limit,
    runTransaction
} from "firebase/firestore";
import { Loan, LoanStatus, Payment } from "@/types";

const LOANS_COLLECTION = "loans";
const PAYMENTS_COLLECTION = "payments";

export const createLoan = async (loan: Omit<Loan, "id" | "created_at">) => {
    try {
        const docRef = await addDoc(collection(db, LOANS_COLLECTION), {
            ...loan,
            created_at: Timestamp.now(),
            start_date: Timestamp.fromDate(new Date(loan.start_date)),
            due_date: Timestamp.fromDate(new Date(loan.due_date)),
            // If next_due_date is not provided, initially it's the first due date
            next_due_date: loan.next_due_date ? Timestamp.fromDate(new Date(loan.next_due_date)) : Timestamp.fromDate(new Date(loan.due_date))
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding loan: ", error);
        throw error;
    }
};

export const getUserLoans = async (userId: string) => {
    try {
        const q = query(
            collection(db, LOANS_COLLECTION),
            where("user_id", "==", userId)
            // Removed orderBy to avoid index errors for now. Sorting in memory.
        );
        const querySnapshot = await getDocs(q);
        const loans = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                start_date: data.start_date.toDate().toISOString(),
                due_date: data.due_date.toDate().toISOString(),
                next_due_date: data.next_due_date ? data.next_due_date.toDate().toISOString() : undefined,
                created_at: data.created_at.toMillis()
            } as Loan;
        });

        // Sort in memory (descending by created_at)
        return loans.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
        console.error("Error getting loans: ", error);
        throw error;
    }
};

export const makePayment = async (
    loanId: string,
    paymentAmount: number,
    nextDueDate: Date
) => {
    try {
        await runTransaction(db, async (transaction) => {
            const loanRef = doc(db, LOANS_COLLECTION, loanId);
            const loanDoc = await transaction.get(loanRef);

            if (!loanDoc.exists()) {
                throw new Error("Loan does not exist!");
            }

            const loanData = loanDoc.data();
            const newOutstanding = Number(loanData.outstanding_amount) - paymentAmount;

            const newStatus: LoanStatus = newOutstanding <= 0 ? 'closed' : 'active';

            // Update Loan
            transaction.update(loanRef, {
                outstanding_amount: newOutstanding,
                status: newStatus,
                next_due_date: Timestamp.fromDate(nextDueDate)
            });

            // Create Payment Record
            const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
            transaction.set(paymentRef, {
                loan_id: loanId,
                user_id: loanData.user_id,
                amount: paymentAmount,
                paid_on: Timestamp.now(),
                next_due_date: Timestamp.fromDate(nextDueDate)
            });
        });
        return true;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
}

export const getDashboardStats = async (userId: string) => {
    const loans = await getUserLoans(userId);

    const totalToPay = loans
        .filter(l => l.loan_type === 'i_owe' && l.status === 'active')
        .reduce((sum, l) => sum + Number(l.outstanding_amount), 0);

    const totalToReceive = loans
        .filter(l => l.loan_type === 'owed_to_me' && l.status === 'active')
        .reduce((sum, l) => sum + Number(l.outstanding_amount), 0);

    // Upcoming dues: Active loans with next_due_date within 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const upcomingDues = loans.filter(l => {
        if (l.status !== 'active' || !l.next_due_date) return false;
        const due = new Date(l.next_due_date);
        return due >= now && due <= sevenDaysFromNow;
    });

    return {
        totalToPay,
        totalToReceive,
        upcomingDues,
        recentLoans: loans.slice(0, 5),
        allLoans: loans
    };
};
