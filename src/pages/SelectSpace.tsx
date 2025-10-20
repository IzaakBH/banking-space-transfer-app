import {formatAmount} from "../util/Utils"
import type { Step } from '../App'
import type { Transaction, SavingsGoal } from '../api/StarlingClient';

interface SelectSpaceProps {
    selectedTransaction: Transaction | null,
    setSelectedTransaction: (transaction: Transaction | null) => void,
    loading: boolean,
    setStep: (step: Step) => void,
    savingsGoals: SavingsGoal[],
    performTransfer: (savingsGoal: SavingsGoal) => void
}

export const SelectSpace = (props: SelectSpaceProps) => {

    const {
        selectedTransaction,
        setSelectedTransaction,
        setStep,
        savingsGoals,
        performTransfer,
    } = props;

    const renderSpaceButton = (space: SavingsGoal, onSelect: () => void) => {
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
                        : 'bg-white border-2 border-gray-300 hover:border-purple-400 hover:shadow-lg hover:scale-[1.01] cursor-pointer'
                }`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className={`font-semibold text-gray-800`}>
                            {space.name}
                        </div>
                        <div className={`text-sm text-gray-600`}>
                            Balance: {balance ? formatAmount(balance) : 'N/A'}
                        </div>
                        {hasInsufficientFunds && (
                            <div className="text-xs text-red-600 mt-1 font-medium">
                                Insufficient funds
                            </div>
                        )}
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Select Space to Withdraw From</h2>
                <button
                    onClick={() => {
                        setSelectedTransaction(null);
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
                    renderSpaceButton(space, () => performTransfer(space))
                )
            )}
        </div>
    );
}