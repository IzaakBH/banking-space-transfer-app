import React from "react";
import {CheckCircle} from "lucide-react";
import {formatAmount} from "../util/Utils"

interface SelectSpaceProps {
    selectedTransaction: Transaction,
    setSelectedTransaction: (transaction: Transaction) => void,
    selectedSavingsGoal: SavingsGoal,
    setSelectedSavingsGoal: (savingsGoal: SavingsGoal) => void,
    loading: boolean,
    setStep: (step: string) => void,
    savingsGoals: SavingsGoal[],
    performTransfer: () => void
}

export const SelectSpace = (props: SelectSpaceProps) => {

    const {
        selectedTransaction,
        setSelectedTransaction,
        selectedSavingsGoal,
        setSelectedSavingsGoal,
        loading,
        setStep,
        savingsGoals,
        performTransfer,
    } = props;

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

    return (
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
    );
}