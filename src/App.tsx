import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { SelectSpace } from './pages/SelectSpace';
import { Setup } from './pages/Setup';
import { SelectAccount } from './pages/SelectAccount';
import { SelectTransaction } from './pages/SelectTransaction';

// Types
interface Amount {
    currency: string;
    minorUnits: number;
}

interface Account {
    accountUid: string;
    accountType: string;
    defaultCategory: string;
    currency: string;
    createdAt: string;
    name?: string;
}

interface Transaction {
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

interface SavingsGoal {
    savingsGoalUid: string;
    name: string;
    target?: Amount;
    totalSaved: Amount;
    savedPercentage?: number;
}

type Step = 'setup' | 'selectAccount' | 'selectTransaction' | 'selectSpace';

const SpaceTransferApp: React.FC = () => {
    const [step, setStep] = useState<Step>('setup');
    const [accessToken, setAccessToken] = useState<string>('');
    const [environment, setEnvironment] = useState<'live' | 'dev'>('live');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedSavingsGoal, setSelectedSavingsGoal] = useState<SavingsGoal | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const API_BASE = environment === 'live' ? '/live/api' : '/dev/api';

    // Generic API fetch wrapper
    const apiFetch = async (endpoint: string, options?: RequestInit) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...options?.headers,
            }
        });
        if (!res.ok) throw new Error(`API request failed: ${endpoint}`);
        return res.json();
    };

    const apiFetchNoResponse = async (endpoint: string, options?: RequestInit) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...options?.headers,
            }
        });
        if (!res.ok) throw new Error(`API request failed: ${endpoint}`);
    }

    const fetchAccounts = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/v2/accounts');
            setAccounts(data.accounts || []);
            setStep('selectAccount');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async (accountUid: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const minDate = weekAgo.toISOString();
            const maxDate = now.toISOString();

            const data = await apiFetch(
                `/v2/feed/account/${accountUid}/settled-transactions-between?minTransactionTimestamp=${minDate}&maxTransactionTimestamp=${maxDate}`
            );

            const filtered = (data.feedItems || []).filter((item: Transaction) =>
                item.direction === 'OUT' &&
                (item.status === 'SETTLED' || item.status === 'PENDING') &&
                (!item.userNote || !item.userNote.includes('transferred: true'))
            );

            setTransactions(filtered);
            setStep('selectTransaction');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchSpaces = async (accountUid: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/v2/account/${accountUid}/spaces`);
            setSavingsGoals(data.savingsGoals || []);
            setStep('selectSpace');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const tagTransaction = async (): Promise<void> => {
        if (!selectedTransaction || !selectedAccount) return;

        const note = selectedTransaction.userNote
            ? `${selectedTransaction.userNote} | transferred: true`
            : 'transferred: true';

        await apiFetchNoResponse(
            `/v2/feed/account/${selectedAccount.accountUid}/category/${selectedTransaction.categoryUid}/${selectedTransaction.feedItemUid}/user-note`,
            {
                method: 'PUT',
                body: JSON.stringify({ userNote: note })
            }
        );

        setSuccess('Transaction tagged successfully!');
        setTransactions(prev => prev.filter(t => t.feedItemUid !== selectedTransaction.feedItemUid));
        setSelectedTransaction(null);
        setSelectedSavingsGoal(null);
        setStep('selectTransaction');
        setTimeout(() => setSuccess(null), 3000);
    };

    const ignoreTransaction = async (): Promise<void> => {
        if (!selectedAccount || !selectedTransaction) return;
        setLoading(true);
        setError(null);
        try {
            await tagTransaction();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const performTransfer = async (): Promise<void> => {
        if (!selectedAccount || !selectedTransaction || !selectedSavingsGoal) return;

        setLoading(true);
        setError(null);
        try {
            await apiFetch(
                `/v2/account/${selectedAccount.accountUid}/savings-goals/${selectedSavingsGoal.savingsGoalUid}/withdraw-money/${selectedTransaction.feedItemUid}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        amount: {
                            currency: selectedTransaction.amount.currency,
                            minorUnits: selectedTransaction.amount.minorUnits
                        }
                    })
                }
            );

            await tagTransaction();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };


    const reset = (): void => {
        setStep('setup');
        setSelectedAccount(null);
        setTransactions([]);
        setSavingsGoals([]);
        setSelectedTransaction(null);
        setSelectedSavingsGoal(null);
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
                    <div className="flex items-center justify-between mb-6 relative">
                        <div className="flex items-center gap-3">
                            <Wallet className="w-8 h-8 text-purple-600"/>
                            <h1 className="text-2xl font-bold text-gray-800">Space Transfer Tool</h1>
                        </div>
                        {step !== 'setup' && (
                            <button onClick={reset}
                                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
                                <RefreshCw className="w-4 h-4"/>
                                Reset
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"/>
                            <div className="text-red-800 text-sm">{error}</div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"/>
                            <div className="text-green-800 text-sm">{success}</div>
                        </div>
                    )}

                    { loading && (
                    <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
                        <div className="flex justify-center items-center mt-[50vh]">
                            <span className="text-3xl mr-4">Loading</span>
                            <svg className="animate-spin h-8 w-8 text-gray-800" xmlns="http://www.w3.org/2000/svg"
                                 fill="none"
                                 viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        stroke-width="4"></circle>
                                <path className="opacity-75" fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                            </svg>
                        </div>
                    </div>
                    )}

                    {step === 'setup' && (
                        <Setup
                            environment={environment}
                            setEnvironment={setEnvironment}
                            accessToken={accessToken}
                            setAccessToken={setAccessToken}
                            fetchAccounts={fetchAccounts}
                            loading={loading}
                        />
                    )}

                    {step === 'selectAccount' && (
                        <SelectAccount
                            accounts={accounts}
                            setSelectedAccount={setSelectedAccount}
                            fetchTransactions={fetchTransactions}
                        />
                    )}

                    {step === 'selectTransaction' && (
                        <SelectTransaction
                            transactions={transactions}
                            setSelectedTransaction={setSelectedTransaction}
                            fetchSpaces={fetchSpaces}
                            ignoreTransaction={ignoreTransaction}
                            selectedAccount={selectedAccount}
                        />
                    )}

                    {step === 'selectSpace' && (
                        <SelectSpace
                            selectedTransaction={selectedTransaction}
                            setSelectedTransaction={setSelectedTransaction}
                            selectedSavingsGoal={selectedSavingsGoal}
                            setSelectedSavingsGoal={setSelectedSavingsGoal}
                            loading={loading}
                            setStep={setStep}
                            savingsGoals={savingsGoals}
                            performTransfer={performTransfer}
                        />
                    )}
                </div>

                <div className="text-center text-sm text-gray-600">
                    <p>Starling Bank Space Transfer Tool</p>
                    <p className="text-xs mt-1">Environment: {environment === 'live' ? 'Live' : 'Dev'} | Uses Starling
                        Bank API v2</p>
                </div>
            </div>
        </div>
    );
};

export default SpaceTransferApp;