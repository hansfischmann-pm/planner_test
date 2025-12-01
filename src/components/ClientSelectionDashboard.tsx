import React from 'react';
import { Brand } from '../types';
import { Building2, TrendingUp, Wallet, ArrowRight, Link2 } from 'lucide-react';

interface ClientSelectionDashboardProps {
    brands: Brand[];
    onSelectBrand: (brand: Brand) => void;
    onViewAnalytics: () => void;
    onViewIntegrations: () => void;
}

export const ClientSelectionDashboard: React.FC<ClientSelectionDashboardProps> = ({ brands, onSelectBrand, onViewAnalytics, onViewIntegrations }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-lg">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Agency Workspace</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onViewIntegrations}
                            className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center gap-2"
                        >
                            <Link2 className="h-4 w-4" />
                            Integrations
                        </button>
                        <button
                            onClick={onViewAnalytics}
                            className="text-sm font-medium text-gray-600 hover:text-purple-600 flex items-center gap-2"
                        >
                            <TrendingUp className="h-4 w-4" />
                            Agency Analytics
                        </button>
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                            A
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Select a Client</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage campaigns and media plans for your portfolio</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {brands.map((brand) => (
                        <div
                            key={brand.id}
                            onClick={() => onSelectBrand(brand)}
                            className="bg-white overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 group"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-2">
                                            <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                {brand.name}
                                            </h3>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            Active Campaigns
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900">{brand.activeCampaigns}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                            <Wallet className="h-3 w-3" />
                                            Total Spend
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900">
                                            ${(brand.totalSpend || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                                <div className="text-xs text-gray-500 flex justify-between items-center">
                                    <span>Budget Utilization</span>
                                    <span className="font-medium">
                                        {Math.round(((brand.totalSpend || 0) / (brand.budget || 1)) * 100)}%
                                    </span>
                                </div>
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-purple-600 h-1.5 rounded-full"
                                        style={{ width: `${Math.min(100, Math.round(((brand.totalSpend || 0) / (brand.budget || 1)) * 100))}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};
