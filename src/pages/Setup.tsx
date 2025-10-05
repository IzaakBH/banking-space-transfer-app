import {ArrowRight} from "lucide-react";
import type { Env } from "../App";

interface SetupProps {
    environment: string,
    setEnvironment: (env: Env) => void,
    accessToken: string,
    setAccessToken: (accessToken: string) => void
    fetchAccounts: () => void,
    loading: boolean,
}

export const Setup = (props: SetupProps) => {

    const { environment, setEnvironment, accessToken, setAccessToken, fetchAccounts, loading } = props;

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
                    Required scopes: account:read, account-list:read, transaction:read, space:read, transaction:edit,
                    savings-goal-transfer:create
                </p>
            </div>
            <button
                onClick={fetchAccounts}
                disabled={!accessToken || loading}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 hover:shadow-lg hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all shadow-md flex items-center justify-center gap-2"
            >
                {loading ? 'Loading...' : 'Load Accounts'}
                {!loading && <ArrowRight className="w-5 h-5"/>}
            </button>
        </div>
    );
};