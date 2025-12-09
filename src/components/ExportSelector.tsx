/**
 * Export Type Selector Component
 *
 * Modal for selecting export type, format, and customizing sections.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Presentation,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronRight,
  Check,
  Settings,
  Eye,
  EyeOff,
  FileBarChart,
  BarChart3,
  PieChart,
  TrendingUp,
  Briefcase,
  Layers,
} from 'lucide-react';
import {
  ExportType,
  ExportFormat,
  ExportContext,
  SectionConfig,
  EXPORT_TYPE_CONFIGS,
  getAvailableExportTypes,
  getRecommendedExportType,
  isFormatSupported,
} from '../config/exportConfig';
import { Spinner } from './Spinner';

interface ExportSelectorProps {
  context: ExportContext;
  onExport: (exportType: ExportType, format: ExportFormat, sections: SectionConfig[]) => void;
  onClose: () => void;
}

const exportTypeIcons: Record<ExportType, React.ReactNode> = {
  MEDIA_PLAN: <FileText className="w-5 h-5" />,
  CAMPAIGN_BRIEF: <Briefcase className="w-5 h-5" />,
  POST_CAMPAIGN: <BarChart3 className="w-5 h-5" />,
  DATA_APPEND: <FileSpreadsheet className="w-5 h-5" />,
  ATTRIBUTION_REPORT: <PieChart className="w-5 h-5" />,
  FORECAST_REPORT: <TrendingUp className="w-5 h-5" />,
  PORTFOLIO_SUMMARY: <Layers className="w-5 h-5" />,
  FLIGHT_DETAIL: <FileBarChart className="w-5 h-5" />,
};

const formatIcons: Record<ExportFormat, React.ReactNode> = {
  PDF: <FileText className="w-4 h-4" />,
  PPT: <Presentation className="w-4 h-4" />,
  CSV: <FileSpreadsheet className="w-4 h-4" />,
  XLSX: <FileSpreadsheet className="w-4 h-4" />,
};

export const ExportSelector: React.FC<ExportSelectorProps> = ({
  context,
  onExport,
  onClose,
}) => {
  const availableTypes = useMemo(() => getAvailableExportTypes(context), [context]);
  const recommendedType = useMemo(() => getRecommendedExportType(context), [context]);

  const [selectedType, setSelectedType] = useState<ExportType>(recommendedType);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PDF');
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [customSections, setCustomSections] = useState<SectionConfig[]>(
    () => [...EXPORT_TYPE_CONFIGS[recommendedType].sections]
  );
  const [isExporting, setIsExporting] = useState(false);

  // Config is accessed directly via EXPORT_TYPE_CONFIGS[selectedType] where needed

  // Update sections when type changes
  const handleTypeChange = (type: ExportType) => {
    setSelectedType(type);
    setCustomSections([...EXPORT_TYPE_CONFIGS[type].sections]);
    // Reset format if not supported
    if (!isFormatSupported(type, selectedFormat)) {
      setSelectedFormat(EXPORT_TYPE_CONFIGS[type].supportedFormats[0]);
    }
  };

  const toggleSection = (sectionType: string) => {
    setCustomSections(prev =>
      prev.map(s =>
        s.type === sectionType ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedType, selectedFormat, customSections);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    }
  };

  const getSectionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      title: 'Title Slide',
      executive_summary: 'Executive Summary',
      budget_overview: 'Budget Overview',
      placement_table: 'Placement Details',
      channel_breakdown: 'Channel Breakdown',
      channel_chart: 'Channel Chart',
      timeline_gantt: 'Timeline / Gantt',
      audience_summary: 'Audience Summary',
      performance_metrics: 'Performance Metrics',
      performance_chart: 'Performance Chart',
      attribution_models: 'Attribution Models',
      attribution_chart: 'Attribution Chart',
      recommendations: 'Recommendations',
      next_steps: 'Next Steps',
      appendix: 'Appendix',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Export Document</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Choose export type and customize sections
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableTypes.map(type => {
                const config = EXPORT_TYPE_CONFIGS[type];
                const isSelected = selectedType === type;
                const isRecommended = type === recommendedType;

                return (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`relative flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {exportTypeIcons[type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          isSelected ? 'text-purple-900' : 'text-gray-900'
                        }`}>
                          {config.name}
                        </span>
                        {isRecommended && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {config.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Format
            </label>
            <div className="flex gap-2">
              {(['PDF', 'PPT', 'XLSX', 'CSV'] as ExportFormat[]).map(format => {
                const supported = isFormatSupported(selectedType, format);
                const isSelected = selectedFormat === format;

                return (
                  <button
                    key={format}
                    onClick={() => supported && setSelectedFormat(format)}
                    disabled={!supported}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      !supported
                        ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50'
                        : isSelected
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {formatIcons[format]}
                    <span className="font-medium">{format}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Customization */}
          <div>
            <button
              onClick={() => setShowSectionEditor(!showSectionEditor)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Settings className="w-4 h-4" />
              Customize Sections
              {showSectionEditor ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {showSectionEditor && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-3">
                  Toggle sections to include in your export
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {customSections
                    .sort((a, b) => a.order - b.order)
                    .map(section => (
                      <button
                        key={section.type}
                        onClick={() => toggleSection(section.type)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          section.enabled
                            ? 'bg-white border border-gray-200 text-gray-900'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {section.enabled ? (
                          <Eye className="w-4 h-4 text-green-500" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                        <span>{getSectionLabel(section.type)}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {customSections.filter(s => s.enabled).length} sections selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Spinner size="sm" color="white" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {selectedFormat}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSelector;
