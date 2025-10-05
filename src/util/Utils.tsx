import { Amount } from '../App'

export const formatAmount = (amount: Amount): string => {
    const value = (amount.minorUnits / 100).toFixed(2);
    return `${amount.currency} ${value}`;
}

