import { Segment } from '../types';

/**
 * Comprehensive library of audience segments for targeting
 * Includes demographics, behavioral, interest-based, B2B, contextual, and first-party segments
 */

// Segment Categories
export type SegmentCategory =
    | 'Demographics'
    | 'Behavioral'
    | 'Interest'
    | 'B2B'
    | 'Contextual'
    | 'First-Party'
    | 'Pixel-Based';

// Data Providers (DMPs and Contextual Providers)
export const DATA_PROVIDERS = {
    // DMPs
    'Adobe Audience Manager': { type: 'DMP' as const },
    'Lotame': { type: 'DMP' as const },
    'Oracle Data Cloud': { type: 'DMP' as const },
    'Neustar': { type: 'DMP' as const },
    'LiveRamp': { type: 'DMP' as const },

    // Contextual & Brand Safety
    'IAS (Integral Ad Science)': { type: 'Contextual' as const },
    'DoubleVerify': { type: 'Contextual' as const },
    'IRIS.TV': { type: 'Contextual' as const },
    'GumGum': { type: 'Contextual' as const },
    'Grapeshot (Oracle)': { type: 'Contextual' as const },

    // Identity Resolution
    'Neustar IDMP': { type: 'Identity' as const },
    'LiveIntent': { type: 'Identity' as const },
    'Viant': { type: 'Identity' as const },
    'The Trade Desk UID2': { type: 'Identity' as const }
};

/**
 * Comprehensive Segment Library
 * CPM uplift represents additional cost per thousand impressions
 */
export const SEGMENT_LIBRARY: Omit<Segment, 'id'>[] = [
    // ===== DEMOGRAPHICS =====
    {
        name: 'Adults 18-24',
        category: 'Demographics',
        vendor: 'Adobe Audience Manager',
        reach: 42000000,
        cpmUplift: 0,
        description: 'Young adults, typically college students and early career professionals'
    },
    {
        name: 'Adults 25-34',
        category: 'Demographics',
        vendor: 'Adobe Audience Manager',
        reach: 65000000,
        cpmUplift: 0.25,
        description: 'Millennials in prime career and family formation years'
    },
    {
        name: 'Adults 35-44',
        category: 'Demographics',
        vendor: 'Adobe Audience Manager',
        reach: 54000000,
        cpmUplift: 0.20,
        description: 'Established professionals with higher purchasing power'
    },
    {
        name: 'Adults 45-54',
        category: 'Demographics',
        vendor: 'Adobe Audience Manager',
        reach: 52000000,
        cpmUplift: 0.15,
        description: 'Mid-career professionals with peak earning potential'
    },
    {
        name: 'Adults 55-64',
        category: 'Demographics',
        vendor: 'Adobe Audience Manager',
        reach: 48000000,
        cpmUplift: 0.10,
        description: 'Pre-retirement age with established wealth'
    },
    {
        name: 'Adults 65+',
        category: 'Demographics',
        vendor: 'Adobe Audience Manager',
        reach: 56000000,
        cpmUplift: 0,
        description: 'Retirees and seniors'
    },
    {
        name: 'Households $50k-$75k',
        category: 'Demographics',
        vendor: 'Neustar',
        reach: 28000000,
        cpmUplift: 0.50,
        description: 'Middle-income households'
    },
    {
        name: 'Households $75k-$100k',
        category: 'Demographics',
        vendor: 'Neustar',
        reach: 22000000,
        cpmUplift: 1.00,
        description: 'Upper-middle income households'
    },
    {
        name: 'Households $100k-$150k',
        category: 'Demographics',
        vendor: 'Neustar',
        reach: 18000000,
        cpmUplift: 1.75,
        description: 'Affluent households with strong disposable income'
    },
    {
        name: 'Households $150k+',
        category: 'Demographics',
        vendor: 'Neustar',
        reach: 12000000,
        cpmUplift: 2.50,
        description: 'High net worth households'
    },
    {
        name: 'College Educated',
        category: 'Demographics',
        vendor: 'Oracle Data Cloud',
        reach: 85000000,
        cpmUplift: 0.35,
        description: 'Adults with bachelor\'s degree or higher'
    },
    {
        name: 'Parents with Children',
        category: 'Demographics',
        vendor: 'Lotame',
        reach: 45000000,
        cpmUplift: 0.75,
        description: 'Households with children under 18'
    },

    // ===== BEHAVIORAL (Intent-Based) =====
    {
        name: 'In-Market Auto Buyers',
        category: 'Behavioral',
        vendor: 'Oracle Data Cloud',
        reach: 8500000,
        cpmUplift: 4.50,
        description: 'Consumers actively researching vehicle purchases within 90 days'
    },
    {
        name: 'Recent Home Buyers',
        category: 'Behavioral',
        vendor: 'Neustar',
        reach: 2500000,
        cpmUplift: 5.00,
        description: 'Purchased home within last 6 months'
    },
    {
        name: 'Recent Movers',
        category: 'Behavioral',
        vendor: 'Neustar',
        reach: 6000000,
        cpmUplift: 3.25,
        description: 'Changed residence within last 3 months'
    },
    {
        name: 'Luxury Shoppers',
        category: 'Behavioral',
        vendor: 'Oracle Data Cloud',
        reach: 4200000,
        cpmUplift: 5.50,
        description: 'High-value shoppers with history of premium purchases'
    },
    {
        name: 'Tech Early Adopters',
        category: 'Behavioral',
        vendor: 'Lotame',
        reach: 12000000,
        cpmUplift: 2.75,
        description: 'First to adopt new technology and gadgets'
    },
    {
        name: 'Frequent Travelers',
        category: 'Behavioral',
        vendor: 'Oracle Data Cloud',
        reach: 15000000,
        cpmUplift: 3.00,
        description: '5+ trips per year, mix of business and leisure'
    },
    {
        name: 'Home Improvement Intenders',
        category: 'Behavioral',
        vendor: 'Lotame',
        reach: 18000000,
        cpmUplift: 2.25,
        description: 'Planning home renovation or remodeling projects'
    },
    {
        name: 'Health & Wellness Enthusiasts',
        category: 'Behavioral',
        vendor: 'Adobe Audience Manager',
        reach: 22000000,
        cpmUplift: 2.00,
        description: 'Active in fitness, nutrition, and healthy lifestyle'
    },
    {
        name: 'Financial Services Engaged',
        category: 'Behavioral',
        vendor: 'Neustar',
        reach: 14000000,
        cpmUplift: 3.50,
        description: 'Actively researching investments, insurance, or banking products'
    },

    // ===== INTEREST-BASED =====
    {
        name: 'Sports Enthusiasts',
        category: 'Interest',
        vendor: 'Lotame',
        reach: 45000000,
        cpmUplift: 1.75,
        description: 'Heavy consumers of sports content and events'
    },
    {
        name: 'NFL Fans',
        category: 'Interest',
        vendor: 'Oracle Data Cloud',
        reach: 28000000,
        cpmUplift: 2.50,
        description: 'Passionate NFL followers and viewers'
    },
    {
        name: 'NBA Fans',
        category: 'Interest',
        vendor: 'Oracle Data Cloud',
        reach: 22000000,
        cpmUplift: 2.25,
        description: 'Basketball fans and NBA followers'
    },
    {
        name: 'Travel Intenders',
        category: 'Interest',
        vendor: 'Adobe Audience Manager',
        reach: 35000000,
        cpmUplift: 2.50,
        description: 'Planning trips in next 6 months'
    },
    {
        name: 'Foodies & Dining',
        category: 'Interest',
        vendor: 'Lotame',
        reach: 42000000,
        cpmUplift: 1.50,
        description: 'Restaurant enthusiasts and culinary interested'
    },
    {
        name: 'Fashion & Beauty',
        category: 'Interest',
        vendor: 'Oracle Data Cloud',
        reach: 38000000,
        cpmUplift: 2.00,
        description: 'Fashion-forward and beauty product consumers'
    },
    {
        name: 'Home & Garden',
        category: 'Interest',
        vendor: 'Lotame',
        reach: 32000000,
        cpmUplift: 1.75,
        description: 'DIY, gardening, and home decor enthusiasts'
    },
    {
        name: 'Gaming & Esports',
        category: 'Interest',
        vendor: 'Adobe Audience Manager',
        reach: 52000000,
        cpmUplift: 2.25,
        description: 'Video game players and esports fans'
    },

    // ===== B2B SEGMENTS =====
    {
        name: 'IT Decision Makers',
        category: 'B2B',
        vendor: 'Oracle Data Cloud',
        reach: 3500000,
        cpmUplift: 8.00,
        description: 'Technology purchase influencers and decision makers'
    },
    {
        name: 'C-Suite Executives',
        category: 'B2B',
        vendor: 'Neustar',
        reach: 2200000,
        cpmUplift: 10.00,
        description: 'CEOs, CFOs, COOs and other C-level executives'
    },
    {
        name: 'Marketing Decision Makers',
        category: 'B2B',
        vendor: 'Oracle Data Cloud',
        reach: 4800000,
        cpmUplift: 7.00,
        description: 'Marketing leaders and budget holders'
    },
    {
        name: 'Small Business Owners',
        category: 'B2B',
        vendor: 'Lotame',
        reach: 8500000,
        cpmUplift: 5.50,
        description: 'Entrepreneurs and small business proprietors'
    },
    {
        name: 'Enterprise (1000+ employees)',
        category: 'B2B',
        vendor: 'Oracle Data Cloud',
        reach: 1800000,
        cpmUplift: 9.00,
        description: 'Employees at large enterprise organizations'
    },
    {
        name: 'Healthcare Professionals',
        category: 'B2B',
        vendor: 'Neustar',
        reach: 5200000,
        cpmUplift: 6.50,
        description: 'Doctors, nurses, and medical practitioners'
    },

    // ===== CONTEXTUAL SEGMENTS (Content-Based) =====
    {
        name: 'News & Current Events',
        category: 'Contextual',
        vendor: 'IAS (Integral Ad Science)',
        reach: 120000000,
        cpmUplift: 1.00,
        description: 'Ads placed alongside news and current events content'
    },
    {
        name: 'Business & Finance Content',
        category: 'Contextual',
        vendor: 'DoubleVerify',
        reach: 45000000,
        cpmUplift: 2.00,
        description: 'Financial news, investing, and business content'
    },
    {
        name: 'Sports Content',
        category: 'Contextual',
        vendor: 'IAS (Integral Ad Science)',
        reach: 68000000,
        cpmUplift: 1.75,
        description: 'Sports news, scores, and analysis'
    },
    {
        name: 'Entertainment & Celebrity',
        category: 'Contextual',
        vendor: 'DoubleVerify',
        reach: 85000000,
        cpmUplift: 1.25,
        description: 'Entertainment news, movies, TV, and celebrity content'
    },
    {
        name: 'Technology Content',
        category: 'Contextual',
        vendor: 'GumGum',
        reach: 42000000,
        cpmUplift: 2.25,
        description: 'Tech news, reviews, and product coverage'
    },
    {
        name: 'Travel Content',
        category: 'Contextual',
        vendor: 'DoubleVerify',
        reach: 38000000,
        cpmUplift: 2.00,
        description: 'Travel destinations, tips, and booking content'
    },
    {
        name: 'Automotive Content',
        category: 'Contextual',
        vendor: 'IAS (Integral Ad Science)',
        reach: 32000000,
        cpmUplift: 2.50,
        description: 'Car reviews, automotive news, and buying guides'
    },
    {
        name: 'Premium Video Content',
        category: 'Contextual',
        vendor: 'IRIS.TV',
        reach: 95000000,
        cpmUplift: 3.00,
        description: 'High-quality video content across streaming platforms'
    },
    {
        name: 'Brand-Safe News',
        category: 'Contextual',
        vendor: 'IAS (Integral Ad Science)',
        reach: 75000000,
        cpmUplift: 1.50,
        description: 'News content vetted for brand safety and suitability'
    },

    // ===== PIXEL-BASED / RETARGETING =====
    {
        name: 'Website Visitors (Last 30 Days)',
        category: 'Pixel-Based',
        vendor: 'First-Party',
        reach: 0, // Varies by client
        cpmUplift: 1.50,
        description: 'Users who visited your website in last 30 days'
    },
    {
        name: 'Cart Abandoners',
        category: 'Pixel-Based',
        vendor: 'First-Party',
        reach: 0, // Varies by client
        cpmUplift: 2.50,
        description: 'Users who added items to cart but didn\'t complete purchase'
    },
    {
        name: 'Product Page Viewers',
        category: 'Pixel-Based',
        vendor: 'First-Party',
        reach: 0, // Varies by client
        cpmUplift: 2.00,
        description: 'Users who viewed specific product pages'
    },
    {
        name: 'Past Converters',
        category: 'Pixel-Based',
        vendor: 'First-Party',
        reach: 0, // Varies by client
        cpmUplift: 3.00,
        description: 'Users who previously completed a conversion'
    },
    {
        name: 'Email Subscribers',
        category: 'First-Party',
        vendor: 'First-Party',
        reach: 0, // Varies by client
        cpmUplift: 2.25,
        description: 'Users matched to email subscriber list via identity resolution'
    },
    {
        name: 'CRM Customers',
        category: 'First-Party',
        vendor: 'First-Party',
        reach: 0, // Varies by client
        cpmUplift: 3.50,
        description: 'Existing customers from CRM matched via LiveRamp or similar'
    },
    {
        name: 'High-Value Customers',
        category: 'First-Party',
        vendor: 'First-Party',
        reach: 0, // Varies by client
        cpmUplift: 5.00,
        description: 'Top 20% of customers by lifetime value'
    },

    // ===== LOOKALIKE SEGMENTS =====
    {
        name: 'Lookalike - Best Customers',
        category: 'First-Party',
        vendor: 'LiveRamp',
        reach: 0, // Varies by client
        cpmUplift: 4.00,
        description: 'Similar audience to your best customers based on identity graph'
    },
    {
        name: 'Lookalike - Recent Converters',
        category: 'First-Party',
        vendor: 'The Trade Desk UID2',
        reach: 0, // Varies by client
        cpmUplift: 3.50,
        description: 'Similar to users who recently converted'
    },

    // ===== GENERAL / BROAD REACH =====
    {
        name: 'General Audience',
        category: 'Demographics',
        vendor: undefined,
        reach: 250000000,
        cpmUplift: 0,
        description: 'Broad reach with no specific targeting'
    }
];

/**
 * Helper function to get segments by category
 */
export function getSegmentsByCategory(category: SegmentCategory): Omit<Segment, 'id'>[] {
    return SEGMENT_LIBRARY.filter(seg => seg.category === category);
}

/**
 * Helper function to search segments
 */
export function searchSegments(query: string): Omit<Segment, 'id'>[] {
    const lowerQuery = query.toLowerCase();
    return SEGMENT_LIBRARY.filter(seg =>
        seg.name.toLowerCase().includes(lowerQuery) ||
        seg.description?.toLowerCase().includes(lowerQuery) ||
        seg.category.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Helper function to get random segment(s) for data generation
 */
export function getRandomSegments(count: number = 1, category?: SegmentCategory): Omit<Segment, 'id'>[] {
    const pool = category ? getSegmentsByCategory(category) : SEGMENT_LIBRARY;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
