import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export type AlertType = 'success' | 'error';

export interface AlertProps {
    type: AlertType;
    message: string;
}

const alertStyles = {
    success: {
        container: 'bg-green-50 border-green-200',
        text: 'text-green-800',
        icon: CheckCircle,
        iconColor: 'text-green-600'
    },
    error: {
        container: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        icon: AlertCircle,
        iconColor: 'text-red-600'
    },
};

export const Alert: React.FC<AlertProps> = ({ type, message}) => {
    const styles = alertStyles[type];
    const Icon = styles.icon;

    return (
        <div className={`p-4 border rounded-lg flex items-start gap-3 ${styles.container}`}>
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.iconColor}`} />
            <div className={`text-sm ${styles.text}`}>{message}</div>
        </div>
    );
};

export default Alert;