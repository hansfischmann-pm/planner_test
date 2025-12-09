/**
 * Export Section Renderers
 *
 * Modular section components for PDF and PPT exports.
 * Each section can be enabled/disabled and customized via config.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import pptxgen from 'pptxgenjs';
import { MediaPlan, Campaign, Flight, Placement } from '../types';
import {
  BrandingConfig,
  TableStyleConfig,
  ChartConfig,
  SectionConfig,
  DEFAULT_BRANDING,
  DEFAULT_TABLE_STYLE,
  DEFAULT_CHART_CONFIG,
} from '../config/exportConfig';

// =============================================================================
// TYPES
// =============================================================================

export interface ExportData {
  mediaPlan?: MediaPlan;
  campaign?: Campaign;
  flight?: Flight;
  placements?: Placement[];

  // Performance data (for post-campaign)
  performance?: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    cvr: number;
    cpa: number;
    roas: number;
  };

  // Attribution data
  attribution?: {
    models: {
      name: string;
      channels: { channel: string; percentage: number }[];
    }[];
  };

  // Multi-campaign data (for portfolio)
  campaigns?: Campaign[];
}

export interface PDFContext {
  doc: jsPDF;
  branding: BrandingConfig;
  tableStyle: TableStyleConfig;
  chartConfig: ChartConfig;
  currentY: number;
  pageWidth: number;
  pageHeight: number;
  margins: { top: number; right: number; bottom: number; left: number };
}

export interface PPTContext {
  pres: pptxgen;
  branding: BrandingConfig;
  chartConfig: ChartConfig;
  currentSlide: pptxgen.Slide | null;
}

// =============================================================================
// PDF SECTION RENDERERS
// =============================================================================

export const pdfSections = {
  title: (ctx: PDFContext, data: ExportData, config: SectionConfig): number => {
    const { doc, branding, margins } = ctx;
    let y = margins.top;

    // Logo (if configured)
    if (branding.logo) {
      try {
        doc.addImage(branding.logo, 'PNG', margins.left, y, branding.logoWidth || 40, branding.logoHeight || 15);
        y += (branding.logoHeight || 15) + 5;
      } catch (e) {
        console.warn('Failed to add logo to PDF:', e);
      }
    }

    // Title
    const title = config.title || 'Media Plan Export';
    doc.setFontSize(24);
    doc.setTextColor(`#${branding.textColor}`);
    doc.text(title, margins.left, y + 10);
    y += 18;

    // Subtitle with campaign info
    if (data.mediaPlan?.campaign || data.campaign) {
      const campaign = data.mediaPlan?.campaign || data.campaign!;
      doc.setFontSize(14);
      doc.setTextColor(`#${branding.mutedTextColor}`);
      doc.text(`Client: ${campaign.advertiser}`, margins.left, y);
      y += 6;
      doc.text(`Campaign: ${campaign.name}`, margins.left, y);
      y += 6;

      if (campaign.startDate && campaign.endDate) {
        doc.text(`${campaign.startDate} - ${campaign.endDate}`, margins.left, y);
        y += 6;
      }
    }

    // Generated date
    if (branding.showGeneratedDate) {
      doc.setFontSize(10);
      doc.setTextColor(`#${branding.mutedTextColor}`);
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      doc.text(`Generated: ${dateStr}`, ctx.pageWidth - margins.right - 50, margins.top + 5);
    }

    return y + 10;
  },

  executive_summary: (ctx: PDFContext, data: ExportData, _config: SectionConfig): number => {
    const { doc, branding, margins } = ctx;
    let y = ctx.currentY;

    doc.setFontSize(16);
    doc.setTextColor(`#${branding.textColor}`);
    doc.text('Executive Summary', margins.left, y);
    y += 10;

    const campaign = data.mediaPlan?.campaign || data.campaign;
    if (!campaign) return y;

    // Summary cards
    const summaryItems = [
      { label: 'Total Budget', value: `$${campaign.budget.toLocaleString()}` },
      { label: 'Total Spend', value: `$${data.mediaPlan?.totalSpend.toLocaleString() || '0'}` },
      { label: 'Remaining', value: `$${data.mediaPlan?.remainingBudget.toLocaleString() || '0'}` },
      { label: 'Placements', value: (campaign.placements?.length || 0).toString() },
    ];

    doc.setFontSize(10);
    const cardWidth = (ctx.pageWidth - margins.left - margins.right - 30) / 4;

    summaryItems.forEach((item, idx) => {
      const x = margins.left + (idx * (cardWidth + 10));

      // Card background
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(x, y, cardWidth, 20, 2, 2, 'F');

      // Label
      doc.setTextColor(`#${branding.mutedTextColor}`);
      doc.text(item.label, x + 5, y + 7);

      // Value
      doc.setFontSize(14);
      doc.setTextColor(`#${branding.primaryColor}`);
      doc.text(item.value, x + 5, y + 15);
      doc.setFontSize(10);
    });

    return y + 30;
  },

  budget_overview: (ctx: PDFContext, data: ExportData, _config: SectionConfig): number => {
    const { doc, branding, margins } = ctx;
    let y = ctx.currentY;

    doc.setFontSize(16);
    doc.setTextColor(`#${branding.textColor}`);
    doc.text('Budget Overview', margins.left, y);
    y += 10;

    const campaign = data.mediaPlan?.campaign || data.campaign;
    if (!campaign) return y;

    // Budget bar
    const totalSpend = data.mediaPlan?.totalSpend || 0;
    const budget = campaign.budget || 1;
    const spendPercentage = Math.min((totalSpend / budget) * 100, 100);

    const barWidth = ctx.pageWidth - margins.left - margins.right;
    const barHeight = 12;

    // Background
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margins.left, y, barWidth, barHeight, 2, 2, 'F');

    // Spent portion
    doc.setFillColor(parseInt(branding.primaryColor.slice(0, 2), 16),
                     parseInt(branding.primaryColor.slice(2, 4), 16),
                     parseInt(branding.primaryColor.slice(4, 6), 16));
    doc.roundedRect(margins.left, y, barWidth * (spendPercentage / 100), barHeight, 2, 2, 'F');

    y += barHeight + 5;

    // Legend
    doc.setFontSize(9);
    doc.setTextColor(`#${branding.mutedTextColor}`);
    doc.text(`${spendPercentage.toFixed(1)}% allocated`, margins.left, y);
    doc.text(`$${(budget - totalSpend).toLocaleString()} remaining`, margins.left + barWidth - 50, y);

    return y + 15;
  },

  placement_table: (ctx: PDFContext, data: ExportData, config: SectionConfig): number => {
    const { doc, branding, tableStyle, margins } = ctx;
    let y = ctx.currentY;

    doc.setFontSize(16);
    doc.setTextColor(`#${branding.textColor}`);
    doc.text('Media Schedule', margins.left, y);
    y += 8;

    const placements = data.placements ||
                       data.mediaPlan?.campaign.placements ||
                       data.campaign?.placements || [];

    if (placements.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(`#${branding.mutedTextColor}`);
      doc.text('No placements configured', margins.left, y + 5);
      return y + 15;
    }

    // Build table based on options
    const showPerformance = config.options?.showPerformance as boolean;
    const showVariance = config.options?.showVariance as boolean;

    const headers = ['Channel', 'Vendor', 'Ad Unit', 'Dates', 'Rate', 'Qty', 'Cost'];
    if (showPerformance) {
      headers.push('Impr', 'Clicks', 'CTR');
    }
    if (showVariance) {
      headers.push('Var %');
    }

    const tableData = placements.map(p => {
      const row = [
        p.channel,
        p.vendor,
        p.adUnit,
        `${p.startDate} - ${p.endDate}`,
        `$${p.rate.toLocaleString()}`,
        p.quantity.toLocaleString(),
        `$${p.totalCost.toLocaleString()}`
      ];

      if (showPerformance && p.performance) {
        row.push(
          p.performance.impressions?.toLocaleString() || '-',
          p.performance.clicks?.toLocaleString() || '-',
          `${(p.performance.ctr || 0).toFixed(2)}%`
        );
      }

      if (showVariance && p.performance) {
        const variance = ((p.performance.impressions || 0) / p.quantity - 1) * 100;
        row.push(`${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`);
      }

      return row;
    });

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: y,
      theme: 'grid',
      styles: {
        fontSize: tableStyle.fontSize,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [
          parseInt(tableStyle.headerBackground.slice(0, 2), 16),
          parseInt(tableStyle.headerBackground.slice(2, 4), 16),
          parseInt(tableStyle.headerBackground.slice(4, 6), 16)
        ],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });

    return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y + 50;
  },

  channel_breakdown: (ctx: PDFContext, data: ExportData, _config: SectionConfig): number => {
    const { doc, branding, margins } = ctx;
    let y = ctx.currentY;

    doc.setFontSize(16);
    doc.setTextColor(`#${branding.textColor}`);
    doc.text('Channel Breakdown', margins.left, y);
    y += 10;

    const placements = data.placements ||
                       data.mediaPlan?.campaign.placements ||
                       data.campaign?.placements || [];

    // Aggregate by channel
    const channelData: Record<string, { spend: number; count: number }> = {};
    placements.forEach(p => {
      if (!channelData[p.channel]) {
        channelData[p.channel] = { spend: 0, count: 0 };
      }
      channelData[p.channel].spend += p.totalCost;
      channelData[p.channel].count += 1;
    });

    const totalSpend = Object.values(channelData).reduce((sum, c) => sum + c.spend, 0);

    // Table format
    const headers = ['Channel', 'Placements', 'Spend', '% of Total'];
    const tableData = Object.entries(channelData)
      .sort((a, b) => b[1].spend - a[1].spend)
      .map(([channel, data]) => [
        channel,
        data.count.toString(),
        `$${data.spend.toLocaleString()}`,
        `${((data.spend / totalSpend) * 100).toFixed(1)}%`
      ]);

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [
          parseInt(branding.primaryColor.slice(0, 2), 16),
          parseInt(branding.primaryColor.slice(2, 4), 16),
          parseInt(branding.primaryColor.slice(4, 6), 16)
        ],
        textColor: [255, 255, 255],
      },
    });

    return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y + 40;
  },

  performance_metrics: (ctx: PDFContext, data: ExportData, _config: SectionConfig): number => {
    const { doc, branding, margins } = ctx;
    let y = ctx.currentY;

    doc.setFontSize(16);
    doc.setTextColor(`#${branding.textColor}`);
    doc.text('Performance Metrics', margins.left, y);
    y += 10;

    if (!data.performance) {
      doc.setFontSize(10);
      doc.setTextColor(`#${branding.mutedTextColor}`);
      doc.text('Performance data not available', margins.left, y);
      return y + 10;
    }

    const metrics = [
      { label: 'Impressions', value: data.performance.impressions.toLocaleString() },
      { label: 'Clicks', value: data.performance.clicks.toLocaleString() },
      { label: 'Conversions', value: data.performance.conversions.toLocaleString() },
      { label: 'CTR', value: `${data.performance.ctr.toFixed(2)}%` },
      { label: 'CVR', value: `${data.performance.cvr.toFixed(2)}%` },
      { label: 'CPA', value: `$${data.performance.cpa.toFixed(2)}` },
      { label: 'ROAS', value: `${data.performance.roas.toFixed(2)}x` },
    ];

    const cardWidth = (ctx.pageWidth - margins.left - margins.right - 40) / 4;

    metrics.forEach((metric, idx) => {
      const row = Math.floor(idx / 4);
      const col = idx % 4;
      const x = margins.left + (col * (cardWidth + 10));
      const cardY = y + (row * 25);

      doc.setFillColor(249, 250, 251);
      doc.roundedRect(x, cardY, cardWidth, 20, 2, 2, 'F');

      doc.setFontSize(9);
      doc.setTextColor(`#${branding.mutedTextColor}`);
      doc.text(metric.label, x + 5, cardY + 7);

      doc.setFontSize(14);
      doc.setTextColor(`#${branding.primaryColor}`);
      doc.text(metric.value, x + 5, cardY + 16);
    });

    return y + (Math.ceil(metrics.length / 4) * 25) + 10;
  },

  recommendations: (ctx: PDFContext, _data: ExportData, _config: SectionConfig): number => {
    const { doc, branding, margins } = ctx;
    let y = ctx.currentY;

    doc.setFontSize(16);
    doc.setTextColor(`#${branding.textColor}`);
    doc.text('Recommendations', margins.left, y);
    y += 10;

    // Placeholder recommendations
    const recommendations = [
      'Consider increasing budget allocation to top-performing channels',
      'Test new creative formats to improve engagement rates',
      'Expand audience targeting based on conversion data',
    ];

    doc.setFontSize(10);
    recommendations.forEach((rec, idx) => {
      doc.setTextColor(`#${branding.primaryColor}`);
      doc.text(`${idx + 1}.`, margins.left, y);
      doc.setTextColor(`#${branding.textColor}`);
      doc.text(rec, margins.left + 8, y);
      y += 6;
    });

    return y + 5;
  },
};

// =============================================================================
// PPT SECTION RENDERERS
// =============================================================================

export const pptSections = {
  title: (ctx: PPTContext, data: ExportData, config: SectionConfig): void => {
    const { pres, branding } = ctx;
    const slide = pres.addSlide();

    // Logo
    if (branding.logo) {
      try {
        slide.addImage({
          data: branding.logo,
          x: 0.5,
          y: 0.3,
          w: branding.logoWidth ? branding.logoWidth / 25.4 : 1.5,  // mm to inches
          h: branding.logoHeight ? branding.logoHeight / 25.4 : 0.5,
        });
      } catch (e) {
        console.warn('Failed to add logo to PPT:', e);
      }
    }

    const title = config.title || 'Media Plan Recommendation';
    slide.addText(title, {
      x: 0.5, y: 2,
      w: '90%',
      fontSize: 36,
      color: branding.textColor,
      bold: true,
      align: 'center',
    });

    const campaign = data.mediaPlan?.campaign || data.campaign;
    if (campaign) {
      slide.addText(`Client: ${campaign.advertiser}`, {
        x: 0.5, y: 3.2,
        w: '90%',
        fontSize: 18,
        color: branding.mutedTextColor,
        align: 'center',
      });

      slide.addText(`Campaign: ${campaign.name}`, {
        x: 0.5, y: 3.7,
        w: '90%',
        fontSize: 18,
        color: branding.mutedTextColor,
        align: 'center',
      });

      slide.addText(`Budget: $${campaign.budget.toLocaleString()}`, {
        x: 0.5, y: 4.2,
        w: '90%',
        fontSize: 18,
        color: branding.mutedTextColor,
        align: 'center',
      });
    }

    // Footer
    if (branding.showGeneratedDate) {
      const dateStr = new Date().toLocaleDateString();
      slide.addText(`${branding.footerText} | ${dateStr}`, {
        x: 0.5, y: 5,
        w: '90%',
        fontSize: 10,
        color: branding.mutedTextColor,
        align: 'center',
      });
    }

    ctx.currentSlide = slide;
  },

  executive_summary: (ctx: PPTContext, data: ExportData, _config: SectionConfig): void => {
    const { pres, branding } = ctx;
    const slide = pres.addSlide();

    slide.addText('Executive Summary', {
      x: 0.5, y: 0.3,
      fontSize: 24,
      color: branding.textColor,
      bold: true,
    });

    const campaign = data.mediaPlan?.campaign || data.campaign;
    if (!campaign) return;

    const metrics = [
      { label: 'Total Budget', value: `$${campaign.budget.toLocaleString()}`, color: branding.primaryColor },
      { label: 'Total Spend', value: `$${data.mediaPlan?.totalSpend.toLocaleString() || '0'}`, color: '3B82F6' },
      { label: 'Remaining', value: `$${data.mediaPlan?.remainingBudget.toLocaleString() || '0'}`, color: '10B981' },
      { label: 'Placements', value: (campaign.placements?.length || 0).toString(), color: 'F59E0B' },
    ];

    metrics.forEach((metric, idx) => {
      const x = 0.5 + (idx * 2.3);

      slide.addText(metric.label, {
        x, y: 1.5,
        fontSize: 12,
        color: branding.mutedTextColor,
      });

      slide.addText(metric.value, {
        x, y: 2,
        fontSize: 28,
        color: metric.color,
        bold: true,
      });
    });

    ctx.currentSlide = slide;
  },

  placement_table: (ctx: PPTContext, data: ExportData, _config: SectionConfig): void => {
    const { pres, branding } = ctx;
    const slide = pres.addSlide();

    slide.addText('Detailed Media Schedule', {
      x: 0.5, y: 0.3,
      fontSize: 24,
      color: branding.textColor,
      bold: true,
    });

    const placements = data.placements ||
                       data.mediaPlan?.campaign.placements ||
                       data.campaign?.placements || [];

    const rows = placements.map(p => [
      p.channel,
      p.vendor,
      p.adUnit,
      `${p.startDate} - ${p.endDate}`,
      `$${p.rate.toLocaleString()}`,
      p.quantity.toLocaleString(),
      `$${p.totalCost.toLocaleString()}`
    ]);

    // Header row
    rows.unshift(['Channel', 'Vendor', 'Ad Unit', 'Dates', 'Rate', 'Qty', 'Cost']);

    slide.addTable(rows as pptxgen.TableRow[], {
      x: 0.5,
      y: 1,
      w: 9,
      colW: [1, 1.5, 1.5, 2, 1, 1, 1],
      fontSize: 10,
      border: { pt: 1, color: 'E1E1E1' },
      fill: { color: 'F9F9F9' },
      autoPage: true,
    });

    ctx.currentSlide = slide;
  },

  channel_breakdown: (ctx: PPTContext, data: ExportData, _config: SectionConfig): void => {
    const { pres, branding, chartConfig } = ctx;
    const slide = pres.addSlide();

    slide.addText('Channel Breakdown', {
      x: 0.5, y: 0.3,
      fontSize: 24,
      color: branding.textColor,
      bold: true,
    });

    const placements = data.placements ||
                       data.mediaPlan?.campaign.placements ||
                       data.campaign?.placements || [];

    // Aggregate by channel
    const channelData: Record<string, number> = {};
    placements.forEach(p => {
      channelData[p.channel] = (channelData[p.channel] || 0) + p.totalCost;
    });

    const chartData = Object.entries(channelData)
      .sort((a, b) => b[1] - a[1])
      .map(([channel, spend], idx) => ({
        name: channel,
        labels: [channel],
        values: [spend],
      }));

    if (chartData.length > 0) {
      slide.addChart(pres.ChartType.bar, chartData, {
        x: 0.5, y: 1,
        w: 6, h: 4,
        showLegend: chartConfig.showLegend,
        showValue: chartConfig.showValues,
        chartColors: chartConfig.colors,
        barGapWidthPct: 50,
      });

      // Summary table on the right
      const totalSpend = Object.values(channelData).reduce((sum, s) => sum + s, 0);
      const tableRows = Object.entries(channelData)
        .sort((a, b) => b[1] - a[1])
        .map(([channel, spend]) => [
          channel,
          `$${spend.toLocaleString()}`,
          `${((spend / totalSpend) * 100).toFixed(1)}%`
        ]);

      tableRows.unshift(['Channel', 'Spend', '%']);

      slide.addTable(tableRows as pptxgen.TableRow[], {
        x: 7, y: 1,
        w: 2.5,
        fontSize: 9,
        border: { pt: 1, color: 'E1E1E1' },
      });
    }

    ctx.currentSlide = slide;
  },
};

// =============================================================================
// EXPORT ORCHESTRATOR
// =============================================================================

export function renderPDFSection(
  ctx: PDFContext,
  sectionType: string,
  data: ExportData,
  config: SectionConfig
): number {
  const renderer = pdfSections[sectionType as keyof typeof pdfSections];
  if (renderer) {
    return renderer(ctx, data, config);
  }
  console.warn(`Unknown PDF section type: ${sectionType}`);
  return ctx.currentY;
}

export function renderPPTSection(
  ctx: PPTContext,
  sectionType: string,
  data: ExportData,
  config: SectionConfig
): void {
  const renderer = pptSections[sectionType as keyof typeof pptSections];
  if (renderer) {
    renderer(ctx, data, config);
  } else {
    console.warn(`Unknown PPT section type: ${sectionType}`);
  }
}
