export type LoanType = 'i_owe' | 'owed_to_me';
export type LoanStatus = 'active' | 'overdue' | 'closed';
export type PaymentFrequency = 'monthly' | 'weekly' | 'custom';

export interface Loan {
    id?: string;
    user_id: string;
    title: string;
    loan_type: LoanType;
    principal_amount: number;
    emi_amount: number;
    outstanding_amount: number;
    start_date: string; // ISO Date string for easier serializing, or Date object
    due_date: string;
    frequency: PaymentFrequency;
    status: LoanStatus;
    created_at: number; // Timestamp
    next_due_date?: string;
    notes?: string;
}

export interface Payment {
    id?: string;
    loan_id: string;
    user_id?: string;
    amount: number;
    paid_on: string;
    next_due_date: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    created_at: number;
}

export interface Notification {
    id?: string;
    userId: string;
    title: string;
    message: string;
    time: number; // Timestamp
    type: 'warning' | 'success' | 'info';
    read: boolean;
}
