import { useCallback } from 'react';

export type Env = 'live' | 'dev';

export interface Amount {
    currency: string;
    minorUnits: number;
}

export interface Account {
    accountUid: string;
    accountType: string;
    defaultCategory: string;
    currency: string;
    createdAt: string;
    name?: string;
}

export interface Transaction {
    feedItemUid: string;
    categoryUid: string;
    amount: Amount;
    sourceAmount: Amount;
    direction: 'IN' | 'OUT';
    updatedAt: string;
    transactionTime: string;
    settlementTime: string;
    source: string;
    status: string;
    counterPartyName?: string;
    counterPartyType?: string;
    reference?: string;
    country?: string;
    spendingCategory?: string;
    userNote?: string;
}

export interface SavingsGoal {
    savingsGoalUid: string;
    name: string;
    target?: Amount;
    totalSaved: Amount;
    savedPercentage?: number;
}

interface AccountsResponse {
    accounts: Account[];
}

interface TransactionsResponse {
    feedItems: Transaction[];
}

interface SpacesResponse {
    savingsGoals: SavingsGoal[];
}

const DAYS_TO_FETCH = 7;
const TRANSFER_TAG = 'transferred: true';

export const useStarlingAPI = (accessToken: string, environment: Env) => {
    const API_BASE = environment === 'live' ? '/live/api' : '/dev/api';

    // Generic API fetch wrapper with JSON response
    const apiFetch = useCallback(
        async function <T>(endpoint: string, options?: RequestInit): Promise<T> {            const res = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    ...options?.headers,
                }
            });

            if (!res.ok) {
                const errorText = await res.text().catch(() => 'Unknown error');
                throw new Error(`API request failed (${res.status}): ${endpoint} - ${errorText}`);
            }

            return res.json();
        },
        [accessToken, API_BASE]
    );

    // API fetch wrapper without response body
    const apiFetchNoResponse = useCallback(
        async (endpoint: string, options?: RequestInit): Promise<void> => {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    ...options?.headers,
                }
            });

            if (!res.ok) {
                const errorText = await res.text().catch(() => 'Unknown error');
                throw new Error(`API request failed (${res.status}): ${endpoint} - ${errorText}`);
            }
        },
        [accessToken, API_BASE]
    );

    // Filter transactions to only show valid ones
    const filterValidTransactions = (transactions: Transaction[]): Transaction[] => {
        return transactions.filter(item =>
            item.direction === 'OUT' &&
            (item.status === 'SETTLED' || item.status === 'PENDING') &&
            (!item.userNote || !item.userNote.includes(TRANSFER_TAG))
        );
    };

    // Fetch all accounts
    const fetchAccounts = useCallback(async (): Promise<Account[]> => {
        const data = await apiFetch<AccountsResponse>('/v2/accounts');
        return data.accounts || [];
    }, [apiFetch]);

    // Fetch transactions for an account (last 7 days)
    const fetchTransactions = useCallback(
        async (accountUid: string): Promise<Transaction[]> => {
            const now = new Date();
            const weekAgo = new Date(now.getTime() - DAYS_TO_FETCH * 24 * 60 * 60 * 1000);
            const minDate = weekAgo.toISOString();
            const maxDate = now.toISOString();

            const data = await apiFetch<TransactionsResponse>(
                `/v2/feed/account/${accountUid}/settled-transactions-between?minTransactionTimestamp=${minDate}&maxTransactionTimestamp=${maxDate}`
            );

            return filterValidTransactions(data.feedItems || []);
        },
        [apiFetch]
    );

    // Fetch savings goals/spaces for an account
    const fetchSpaces = useCallback(
        async (accountUid: string): Promise<SavingsGoal[]> => {
            const data = await apiFetch<SpacesResponse>(`/v2/account/${accountUid}/spaces`);
            const goals = data.savingsGoals || [];
            return goals.sort((a, b) => a.name.localeCompare(b.name));
        },
        [apiFetch]
    );

    // Tag a transaction with the transfer flag
    const tagTransaction = useCallback(
        async (accountUid: string, categoryUid: string, feedItemUid: string, existingNote?: string): Promise<void> => {
            const note = existingNote
                ? `${existingNote} | ${TRANSFER_TAG}`
                : TRANSFER_TAG;

            await apiFetchNoResponse(
                `/v2/feed/account/${accountUid}/category/${categoryUid}/${feedItemUid}/user-note`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ userNote: note })
                }
            );
        },
        [apiFetchNoResponse]
    );

    // Perform a transfer from a space to cover a transaction
    const performTransfer = useCallback(
        async (
            accountUid: string,
            savingsGoalUid: string,
            feedItemUid: string,
            amount: Amount,
        ): Promise<void> => {
            // First, withdraw from the space
            await apiFetch(
                `/v2/account/${accountUid}/savings-goals/${savingsGoalUid}/withdraw-money/${feedItemUid}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ amount })
                }
            );

        },
        [apiFetch, tagTransaction]
    );

    return {
        fetchAccounts,
        fetchTransactions,
        fetchSpaces,
        tagTransaction,
        performTransfer
    };
};

export default useStarlingAPI;