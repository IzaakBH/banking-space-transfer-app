import {CreditCard} from "lucide-react";
import type { Account } from "../App";
interface SelectAccountProps {
    accounts: Account[],
    setSelectedAccount: (account: Account | null) => void,
    fetchTransactions: (accountUid: string) => void,
}

export const SelectAccount = (props: SelectAccountProps) => {

    const {
        accounts,
        setSelectedAccount,
        fetchTransactions,
    } = props;

    return (
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
    );
}