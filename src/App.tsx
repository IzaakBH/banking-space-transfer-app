import React, { useState } from 'react';
import { ArrowRight, RefreshCw, CheckCircle, AlertCircle, Wallet, CreditCard } from 'lucide-react';

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
                item.status === 'SETTLED' &&
                item.source !== 'DIRECT_DEBIT' &&
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

        await apiFetch(
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

    const formatAmount = (amount: Amount): string => {
        const value = (amount.minorUnits / 100).toFixed(2);
        return `${amount.currency} ${value}`;
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

    const renderSpaceButton = (space: SavingsGoal, isSelected: boolean, onSelect: () => void) => {
        const balance = space.totalSaved;
        const hasInsufficientFunds = (selectedTransaction && balance &&
            balance.minorUnits < selectedTransaction.amount.minorUnits) ?? true;

        return (
            <button
                key={space.savingsGoalUid}
                onClick={() => !hasInsufficientFunds && onSelect()}
                disabled={hasInsufficientFunds}
                className={`w-full p-4 rounded-xl transition-all text-left shadow-sm ${
                    hasInsufficientFunds
                        ? 'bg-gray-100 border-2 border-gray-200 opacity-60 cursor-not-allowed'
                        : isSelected
                            ? 'bg-purple-500 border-2 border-purple-600 shadow-md transform scale-[1.02]'
                            : 'bg-white border-2 border-gray-300 hover:border-purple-400 hover:shadow-lg hover:scale-[1.01] cursor-pointer'
                }`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                            {space.name}
                        </div>
                        <div className={`text-sm ${isSelected ? 'text-purple-100' : 'text-gray-600'}`}>
                            Balance: {balance ? formatAmount(balance) : 'N/A'}
                        </div>
                        {hasInsufficientFunds && (
                            <div className="text-xs text-red-600 mt-1 font-medium">
                                Insufficient funds
                            </div>
                        )}
                    </div>
                    {isSelected && <CheckCircle className="w-6 h-6 text-white" />}
                </div>
            </button>
        );
    };

    const renderActionButton = (label: string, onClick: () => void, bgColor: string, txnId: string) => (
        <button
            key={`${txnId}-${label}`}
            onClick={onClick}
            className={`p-4 ${bgColor} border-2 border-gray-300 rounded-xl hover:border-purple-400 transition-all shadow-sm cursor-pointer hover:shadow-lg hover:scale-[1.01] ${label === 'Categorize' ? 'm-2' : ''}`}
        >
            <div className="font-semibold text-gray-800">{label}</div>
        </button>
    );

    const renderEnvironmentToggle = () => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Environment</label>
            <div className="flex gap-3">
                {(['live', 'dev'] as const).map((env) => (
                    <button
                        key={env}
                        onClick={() => setEnvironment(env)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                            environment === env
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {env.charAt(0).toUpperCase() + env.slice(1)}
                    </button>
                ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
                {environment === 'live'
                    ? 'Using production API (https://api.starlingbank.com)'
                    : 'Using development API (https://api-sandbox.starlingbank.com)'}
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Wallet className="w-8 h-8 text-purple-600" />
                            <h1 className="text-2xl font-bold text-gray-800">Space Transfer Tool</h1>
                        </div>
                        {step !== 'setup' && (
                            <button onClick={reset} className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
                                <RefreshCw className="w-4 h-4" />
                                Reset
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-red-800 text-sm">{error}</div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="text-green-800 text-sm">{success}</div>
                        </div>
                    )}

                    {step === 'setup' && (
                        <div className="space-y-4">
                            {renderEnvironmentToggle()}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Starling API Access Token
                                </label>
                                <input
                                    type="password"
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    placeholder="Enter your access token"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Required scopes: account:read, account-list:read, transaction:read, space:read, transaction:edit, savings-goal-transfer:create
                                </p>
                            </div>
                            <button
                                onClick={fetchAccounts}
                                disabled={!accessToken || loading}
                                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 hover:shadow-lg hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                {loading ? 'Loading...' : 'Load Accounts'}
                                {!loading && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </div>
                    )}

                    {step === 'selectAccount' && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Account</h2>
                            {accounts.map(account => (
                                <button
                                    key={account.accountUid}
                                    onClick={() => {
                                        setSelectedAccount(account);
                                        fetchTransactions(account.accountUid);
                                    }}
                                    className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl hover:border-purple-400 hover:shadow-lg hover:scale-[1.01] transition-all text-left shadow-sm cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-800">{account.name || 'Personal Account'}</div>
                                            <div className="text-sm text-gray-600">{account.accountType}</div>
                                        </div>
                                        <CreditCard className="w-6 h-6 text-purple-500" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'selectTransaction' && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                Select Transaction ({transactions.length} available)
                            </h2>
                            {transactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No eligible transactions found in the last 7 days
                                </div>
                            ) : (
                                transactions.map(txn => (
                                    <div key={txn.feedItemUid} className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl transition-all text-left shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800">{txn.counterPartyName || 'Unknown'}</div>
                                                <div className="text-sm text-gray-600">{txn.reference || 'No reference'}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(txn.transactionTime).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-purple-600">{formatAmount(txn.amount)}</div>
                                            </div>
                                            {renderActionButton('Categorize', () => {
                                                setSelectedTransaction(txn);
                                                fetchSpaces(selectedAccount!.accountUid);
                                            }, 'bg-blue-400', txn.feedItemUid)}
                                            {renderActionButton('Ignore', () => {
                                                setSelectedTransaction(txn);
                                                ignoreTransaction();
                                            }, 'bg-red-400', txn.feedItemUid)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {step === 'selectSpace' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Select Space to Withdraw From</h2>
                                <button
                                    onClick={() => {
                                        setSelectedTransaction(null);
                                        setSelectedSavingsGoal(null);
                                        setStep('selectTransaction');
                                    }}
                                    className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                                >
                                    ← Back
                                </button>
                            </div>
                            {selectedTransaction && (
                                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="text-sm text-blue-800">
                                        <div className="font-medium">Transaction: {selectedTransaction.counterPartyName}</div>
                                        <div className="font-bold">{formatAmount(selectedTransaction.amount)}</div>
                                    </div>
                                </div>
                            )}
                            {savingsGoals.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No savings goals found</div>
                            ) : (
                                savingsGoals.map(space =>
                                    renderSpaceButton(
                                        space,
                                        selectedSavingsGoal?.savingsGoalUid === space.savingsGoalUid,
                                        () => setSelectedSavingsGoal(space)
                                    )
                                )
                            )}
                            {selectedSavingsGoal && (
                                <button
                                    onClick={performTransfer}
                                    disabled={loading}
                                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 hover:shadow-lg hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all shadow-md mt-4"
                                >
                                    {loading ? 'Processing...' : 'Confirm Transfer'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-center text-sm text-gray-600">
                    <p>Starling Bank Space Transfer Tool</p>
                    <p className="text-xs mt-1">Environment: {environment === 'live' ? 'Live' : 'Dev'} | Uses Starling Bank API v2</p>
                </div>
            </div>
        </div>
    );
};

export default SpaceTransferApp;