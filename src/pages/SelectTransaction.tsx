import {formatAmount} from "../util/Utils"
import type {Account, Transaction} from "../App"

interface SelectTransactionProps {
    transactions: Transaction[],
    setSelectedTransaction: (transaction: Transaction | null) => void,
    fetchSpaces: (accountUid: string) => void,
    ignoreTransaction: () => void,
    selectedAccount: Account | null
}

export const SelectTransaction = (props: SelectTransactionProps) => {

    const {
        transactions,
        setSelectedTransaction,
        fetchSpaces,
        ignoreTransaction,
        selectedAccount,
    } = props;

    const renderActionButton = (label: string, onClick: () => void, bgColor: string, txnId: string) => (
        <button
            key={`${txnId}-${label}`}
            onClick={onClick}
            className={`p-4 ${bgColor} border-2 border-gray-300 rounded-xl hover:border-purple-400 transition-all shadow-sm cursor-pointer hover:shadow-lg hover:scale-[1.01] ${label === 'Categorize' ? 'm-2' : ''}`}
        >
            <div className="font-semibold text-gray-800">{label}</div>
        </button>
    );

    return (
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
    );
};