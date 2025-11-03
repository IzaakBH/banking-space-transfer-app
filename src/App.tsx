import React, { useState } from 'react';
import { RefreshCw, Wallet } from 'lucide-react';
import { SelectSpace } from './pages/SelectSpace';
import { Setup } from './pages/Setup';
import { SelectAccount } from './pages/SelectAccount';
import { SelectTransaction } from './pages/SelectTransaction';
import Spinner from './components/Spinner';
import Alert from './components/Alert';
import useStarlingAPI, {type Account, type Transaction, type SavingsGoal} from "./api/StarlingClient.tsx";

export type Step = 'setup' | 'selectAccount' | 'selectTransaction' | 'selectSpace';
export type Env = 'live' | 'dev';

const SpaceTransferApp: React.FC = () => {
    const [step, setStep] = useState<Step>('setup');
    const [accessToken, setAccessToken] = useState<string>('');
    const [environment, setEnvironment] = useState<Env>('live');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const api = useStarlingAPI(accessToken, environment);

    const fetchAccounts = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            setAccounts(await api.fetchAccounts());
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
            setTransactions(await api.fetchTransactions(accountUid));
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
            setSavingsGoals(await api.fetchSpaces(accountUid));
            setStep('selectSpace');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const tagTransaction = async (): Promise<void> => {
        if (!selectedTransaction || !selectedAccount) return;

        await api.tagTransaction(
            selectedAccount.accountUid,
            selectedTransaction.categoryUid,
            selectedTransaction.feedItemUid,
            selectedTransaction.userNote,
        );

        setTransactions(prev => prev.filter(t => t.feedItemUid !== selectedTransaction.feedItemUid));
        setSelectedTransaction(null);
        setStep('selectTransaction');
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

    const performTransfer = async (savingsGoal: SavingsGoal): Promise<void> => {
        if (!selectedAccount || !selectedTransaction || !savingsGoal) return;

        setLoading(true);
        setError(null);
        try {
            await api.performTransfer(
                selectedAccount.accountUid,
                savingsGoal.savingsGoalUid,
                selectedTransaction.feedItemUid,
                selectedTransaction.amount,
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
        setError(null);
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

                    {error && (<Alert type='error' message={error}/>)}
                    { loading && (<Spinner/>)}

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