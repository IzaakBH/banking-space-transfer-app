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

const calculatePercentage = (space: SavingsGoal): number => {
    if (!space.target || space.target.minorUnits === 0) {
        return 0;
    }
    const percentage = (space.totalSaved.minorUnits / space.target.minorUnits) * 100;
    return Math.min(Math.max(percentage, 0), 100);
};

const getGradientStyle = (percentage: number, hasInsufficientFunds: boolean) => {
    if (hasInsufficientFunds) {
        return {
            background: `linear-gradient(135deg, #f3f4f6 0%, #e5e7eb ${percentage}%, #d1d5db ${percentage}%, #d1d5db 100%)`
        };
    }

    // Color transitions: 0-33% Red, 33-66% Orange/Yellow, 66-100% Green
    let gradientColors;
    if (percentage < 33) {
        gradientColors = `#fecaca 0%, #fed7aa ${percentage}%, #ffffff ${percentage}%, #ffffff 100%`;
    } else if (percentage < 66) {
        gradientColors = `#fed7aa 0%, #fef3c7 ${percentage}%, #ffffff ${percentage}%, #ffffff 100%`;
    } else {
        gradientColors = `#fef3c7 0%, #bbf7d0 ${percentage}%, #ffffff ${percentage}%, #ffffff 100%`;
    }

    return {
        background: `linear-gradient(135deg, ${gradientColors})`
    };
};

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
        const percentage = calculatePercentage(space);
        const gradientStyle = getGradientStyle(percentage, hasInsufficientFunds);

        return (
            <button
                key={space.savingsGoalUid}
                onClick={() => !hasInsufficientFunds && onSelect()}
                disabled={hasInsufficientFunds}
                style={gradientStyle}
                className={`w-full p-4 rounded-xl transition-all text-left shadow-sm border-2 ${
                    hasInsufficientFunds
                        ? 'border-gray-300 opacity-60 cursor-not-allowed'
                        : 'border-gray-300 hover:border-purple-400 hover:shadow-lg hover:scale-[1.01] cursor-pointer'
                }`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className={`font-semibold text-gray-800`}>
                            {space.name}
                        </div>
                        <div className={`text-sm text-gray-600`}>
                            Balance: {balance ? formatAmount(balance) : 'N/A'} {space.target && `- Target: ${formatAmount(space.target)} (${percentage.toFixed(0)}%)`}
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