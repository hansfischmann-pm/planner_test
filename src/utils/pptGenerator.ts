/**
 * PPT Generator
 *
 * Generates PowerPoint exports using configurable sections and branding.
 */

import pptxgen from 'pptxgenjs';
import { MediaPlan } from '../types';
import {
  ExportType,
  ExportConfig,
  DEFAULT_EXPORT_CONFIG,
  getEnabledSections,
} from '../config/exportConfig';
import { PPTContext, ExportData, renderPPTSection } from './exportSections';

// =============================================================================
// MAIN EXPORT FUNCTION
// =============================================================================

export interface PPTExportOptions {
  exportType?: ExportType;
  config?: Partial<ExportConfig>;
  filename?: string;
}

export const generateMediaPlanPPT = (
  mediaPlan: MediaPlan,
  options: PPTExportOptions = {}
) => {
  const {
    exportType = 'MEDIA_PLAN',
    config: customConfig,
    filename,
  } = options;

  // Merge custom config with defaults
  const config: ExportConfig = {
    ...DEFAULT_EXPORT_CONFIG,
    ...customConfig,
    branding: { ...DEFAULT_EXPORT_CONFIG.branding, ...customConfig?.branding },
    ppt: { ...DEFAULT_EXPORT_CONFIG.ppt, ...customConfig?.ppt },
  };

  const { campaign } = mediaPlan;

  // Create presentation
  const pres = new pptxgen();

  // Set presentation properties
  pres.author = config.branding.companyName;
  pres.title = `${campaign.name} - ${EXPORT_TYPE_CONFIGS[exportType]?.name || 'Media Plan'}`;
  pres.subject = `Media planning document for ${campaign.advertiser}`;
  pres.company = config.branding.companyName;

  // Set layout
  if (config.ppt.layout === 'LAYOUT_16x9') {
    pres.defineLayout({ name: 'CUSTOM', width: 10, height: 5.625 });
    pres.layout = 'CUSTOM';
  }

  // Initialize context
  const ctx: PPTContext = {
    pres,
    branding: config.branding,
    chartConfig: config.chartConfig,
    currentSlide: null,
  };

  // Prepare data
  const data: ExportData = {
    mediaPlan,
    campaign,
    placements: campaign.placements,
  };

  // Get enabled sections for this export type
  const sections = getEnabledSections(exportType);

  // Render each section
  sections.forEach((sectionConfig) => {
    renderPPTSection(ctx, sectionConfig.type, data, sectionConfig);
  });

  // Generate filename
  const exportName = filename ||
    `${campaign.name.replace(/\s+/g, '_')}_${exportType}_${new Date().toISOString().split('T')[0]}.pptx`;

  pres.writeFile({ fileName: exportName });
};

// Import for type reference
import { EXPORT_TYPE_CONFIGS } from '../config/exportConfig';

// =============================================================================
// LEGACY FUNCTION (for backward compatibility)
// =============================================================================

export const generateSimplePPT = (mediaPlan: MediaPlan) => {
  const pres = new pptxgen();
  const { campaign } = mediaPlan;

  // Slide 1: Title Slide
  const slide1 = pres.addSlide();
  slide1.addText('Media Plan Recommendation', {
    x: 1, y: 1.5,
    fontSize: 36,
    color: '363636',
    bold: true,
    align: 'center',
    w: '80%'
  });
  slide1.addText(`Client: ${campaign.advertiser}`, {
    x: 1, y: 3,
    fontSize: 18,
    color: '666666',
    align: 'center',
    w: '80%'
  });
  slide1.addText(`Campaign: ${campaign.name}`, {
    x: 1, y: 3.5,
    fontSize: 18,
    color: '666666',
    align: 'center',
    w: '80%'
  });
  slide1.addText(`Budget: $${campaign.budget.toLocaleString()}`, {
    x: 1, y: 4,
    fontSize: 18,
    color: '666666',
    align: 'center',
    w: '80%'
  });

  // Slide 2: Executive Summary
  const slide2 = pres.addSlide();
  slide2.addText('Executive Summary', {
    x: 0.5, y: 0.5,
    fontSize: 24,
    color: '363636',
    bold: true
  });

  slide2.addText('Total Spend', { x: 1, y: 2, fontSize: 14, color: '666666' });
  slide2.addText(`$${mediaPlan.totalSpend.toLocaleString()}`, {
    x: 1, y: 2.5,
    fontSize: 32,
    color: '7C3AED',
    bold: true
  });

  slide2.addText('Remaining Budget', { x: 4, y: 2, fontSize: 14, color: '666666' });
  slide2.addText(`$${mediaPlan.remainingBudget.toLocaleString()}`, {
    x: 4, y: 2.5,
    fontSize: 32,
    color: '10B981',
    bold: true
  });

  const placements = campaign.placements || [];

  slide2.addText('Total Placements', { x: 7, y: 2, fontSize: 14, color: '666666' });
  slide2.addText(placements.length.toString(), {
    x: 7, y: 2.5,
    fontSize: 32,
    color: 'F59E0B',
    bold: true
  });

  // Slide 3: Detailed Placements Table
  const slide3 = pres.addSlide();
  slide3.addText('Detailed Media Schedule', {
    x: 0.5, y: 0.5,
    fontSize: 24,
    color: '363636',
    bold: true
  });

  const rows: (string | { text: string })[][] = placements.map(p => [
    p.channel,
    p.vendor,
    p.adUnit,
    `${p.startDate} - ${p.endDate}`,
    `$${p.rate.toLocaleString()}`,
    p.quantity.toLocaleString(),
    `$${p.totalCost.toLocaleString()}`
  ]);

  // Add Header Row
  rows.unshift(['Channel', 'Vendor', 'Ad Unit', 'Dates', 'Rate', 'Qty', 'Cost']);

  slide3.addTable(rows as pptxgen.TableRow[], {
    x: 0.5,
    y: 1.2,
    w: 9,
    colW: [1, 1.5, 1.5, 2, 1, 1, 1],
    fontSize: 10,
    border: { pt: 1, color: 'E1E1E1' },
    fill: { color: 'F9F9F9' },
    autoPage: true,
    autoPageLineWeight: -1
  });

  pres.writeFile({ fileName: `${campaign.name.replace(/\s+/g, '_')}_MediaPlan.pptx` });
};

// =============================================================================
// SPECIALIZED EXPORT FUNCTIONS
// =============================================================================

export const generatePostCampaignPPT = (
  mediaPlan: MediaPlan,
  performanceData?: ExportData['performance']
) => {
  generateMediaPlanPPT(mediaPlan, {
    exportType: 'POST_CAMPAIGN',
    filename: `${mediaPlan.campaign.name.replace(/\s+/g, '_')}_PostCampaign.pptx`,
  });
};

export const generateCampaignBriefPPT = (mediaPlan: MediaPlan) => {
  generateMediaPlanPPT(mediaPlan, {
    exportType: 'CAMPAIGN_BRIEF',
    filename: `${mediaPlan.campaign.name.replace(/\s+/g, '_')}_Brief.pptx`,
  });
};

export const generateAttributionPPT = (
  mediaPlan: MediaPlan,
  attributionData?: ExportData['attribution']
) => {
  generateMediaPlanPPT(mediaPlan, {
    exportType: 'ATTRIBUTION_REPORT',
    filename: `${mediaPlan.campaign.name.replace(/\s+/g, '_')}_Attribution.pptx`,
  });
};
