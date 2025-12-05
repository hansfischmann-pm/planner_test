import React from 'react';
import { PredictiveAlert, AlertSeverity } from '../utils/predictiveAnalytics';
import { AlertTriangle, TrendingUp, AlertCircle, Info, X } from 'lucide-react';

interface PredictiveAlertsPanelProps {
    alerts: PredictiveAlert[];
    onDismiss?: (alertId: string) => void;
    maxAlerts?: number;
}

export const PredictiveAlertsPanel: React.FC<PredictiveAlertsPanelProps> = ({
    alerts,
    onDismiss,
    maxAlerts = 5
}) => {
    if (alerts.length === 0) {
        return null;
    }

    const displayedAlerts = alerts.slice(0, maxAlerts);

    const getIcon = (severity: AlertSeverity) => {
        switch (severity) {
            case 'CRITICAL':
                return <AlertTriangle className="h-5 w-5" />;
            case 'WARNING':
                return <AlertCircle className="h-5 w-5" />;
            case 'INFO':
                return <TrendingUp className="h-5 w-5" />;
        }
    };

    const getSeverityStyles = (severity: AlertSeverity) => {
        switch (severity) {
            case 'CRITICAL':
                return {
                    container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
                    icon: 'text-red-600 dark:text-red-400',
                    title: 'text-red-900 dark:text-red-100',
                    text: 'text-red-700 dark:text-red-300'
                };
            case 'WARNING':
                return {
                    container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
                    icon: 'text-yellow-600 dark:text-yellow-400',
                    title: 'text-yellow-900 dark:text-yellow-100',
                    text: 'text-yellow-700 dark:text-yellow-300'
                };
            case 'INFO':
                return {
                    container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
                    icon: 'text-blue-600 dark:text-blue-400',
                    title: 'text-blue-900 dark:text-blue-100',
                    text: 'text-blue-700 dark:text-blue-300'
                };
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Predictive Insights
                </h3>
                {alerts.length > maxAlerts && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{alerts.length - maxAlerts} more
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {displayedAlerts.map((alert) => {
                    const styles = getSeverityStyles(alert.severity);
                    return (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-lg border ${styles.container} transition-all`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 ${styles.icon}`}>
                                    {getIcon(alert.severity)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h4 className={`text-sm font-semibold ${styles.title}`}>
                                                {alert.title}
                                            </h4>
                                            <p className={`text-xs mt-0.5 ${styles.text}`}>
                                                {alert.entityName} ({alert.entityType.toLowerCase()})
                                            </p>
                                        </div>
                                        {onDismiss && (
                                            <button
                                                onClick={() => onDismiss(alert.id)}
                                                className={`flex-shrink-0 p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors ${styles.icon}`}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <p className={`text-sm mt-2 ${styles.text}`}>
                                        {alert.message}
                                    </p>
                                    {alert.impact && (
                                        <div className={`text-xs mt-2 font-medium ${styles.text}`}>
                                            <span className="opacity-75">Impact:</span> {alert.impact}
                                        </div>
                                    )}
                                    {alert.recommendation && (
                                        <div className={`text-xs mt-2 p-2 rounded ${styles.container} border-l-2 ${alert.severity === 'CRITICAL' ? 'border-red-400' : alert.severity === 'WARNING' ? 'border-yellow-400' : 'border-blue-400'}`}>
                                            <span className="font-semibold">Recommendation:</span>{' '}
                                            {alert.recommendation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
