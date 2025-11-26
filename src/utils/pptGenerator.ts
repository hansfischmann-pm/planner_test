import pptxgen from 'pptxgenjs';
import { MediaPlan } from '../types';

export const generateMediaPlanPPT = (mediaPlan: MediaPlan) => {
    const pres = new pptxgen();
    const { campaign } = mediaPlan;

    // Slide 1: Title Slide
    const slide1 = pres.addSlide();
    slide1.addText('Media Plan Recommendation', { x: 1, y: 1.5, fontSize: 36, color: '363636', bold: true, align: 'center', w: '80%' });
    slide1.addText(`Client: ${campaign.advertiser}`, { x: 1, y: 3, fontSize: 18, color: '666666', align: 'center', w: '80%' });
    slide1.addText(`Campaign: ${campaign.name}`, { x: 1, y: 3.5, fontSize: 18, color: '666666', align: 'center', w: '80%' });
    slide1.addText(`Budget: $${campaign.budget.toLocaleString()}`, { x: 1, y: 4, fontSize: 18, color: '666666', align: 'center', w: '80%' });

    // Slide 2: Executive Summary (Stats)
    const slide2 = pres.addSlide();
    slide2.addText('Executive Summary', { x: 0.5, y: 0.5, fontSize: 24, color: '363636', bold: true });

    slide2.addText('Total Spend', { x: 1, y: 2, fontSize: 14, color: '666666' });
    slide2.addText(`$${mediaPlan.totalSpend.toLocaleString()}`, { x: 1, y: 2.5, fontSize: 32, color: '0078D7', bold: true });

    slide2.addText('Remaining Budget', { x: 4, y: 2, fontSize: 14, color: '666666' });
    slide2.addText(`$${mediaPlan.remainingBudget.toLocaleString()}`, { x: 4, y: 2.5, fontSize: 32, color: '28A745', bold: true });

    slide2.addText('Total Placements', { x: 7, y: 2, fontSize: 14, color: '666666' });
    slide2.addText(campaign.placements.length.toString(), { x: 7, y: 2.5, fontSize: 32, color: 'FF8C00', bold: true });

    // Slide 3: Detailed Placements Table
    const slide3 = pres.addSlide();
    slide3.addText('Detailed Media Schedule', { x: 0.5, y: 0.5, fontSize: 24, color: '363636', bold: true });

    const rows = campaign.placements.map(p => [
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

    slide3.addTable(rows, {
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
