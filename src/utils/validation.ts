/**
 * Validation utilities for user inputs
 */

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates a budget amount
 */
export function validateBudget(value: number | string): ValidationResult {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
        return { isValid: false, error: 'Budget must be a valid number' };
    }

    if (num < 0) {
        return { isValid: false, error: 'Budget cannot be negative' };
    }

    if (num === 0) {
        return { isValid: false, error: 'Budget must be greater than zero' };
    }

    if (num > 100_000_000) {
        return { isValid: false, error: 'Budget exceeds maximum limit ($100M)' };
    }

    return { isValid: true };
}

/**
 * Validates campaign name
 */
export function validateCampaignName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: 'Campaign name is required' };
    }

    if (name.length < 3) {
        return { isValid: false, error: 'Campaign name must be at least 3 characters' };
    }

    if (name.length > 100) {
        return { isValid: false, error: 'Campaign name must be less than 100 characters' };
    }

    // Check for invalid characters
    const invalidChars = /[<>{}]/;
    if (invalidChars.test(name)) {
        return { isValid: false, error: 'Campaign name contains invalid characters' };
    }

    return { isValid: true };
}

/**
 * Validates date range
 */
export function validateDateRange(startDate: Date, endDate: Date): ValidationResult {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        return { isValid: false, error: 'Invalid start date' };
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        return { isValid: false, error: 'Invalid end date' };
    }

    if (endDate < startDate) {
        return { isValid: false, error: 'End date must be after start date' };
    }

    // Check if date range is too long (e.g., more than 2 years)
    const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > twoYearsInMs) {
        return { isValid: false, error: 'Date range cannot exceed 2 years' };
    }

    return { isValid: true };
}

/**
 * Validates budget shift amount
 */
export function validateBudgetShift(
    amount: number,
    sourceBudget: number
): ValidationResult {
    if (amount < 0) {
        return { isValid: false, error: 'Shift amount cannot be negative' };
    }

    if (amount === 0) {
        return { isValid: false, error: 'Shift amount must be greater than zero' };
    }

    if (amount > sourceBudget) {
        return { isValid: false, error: 'Cannot shift more than source campaign budget' };
    }

    // Safety limit: don't allow shifts greater than 50% of source budget
    if (amount > sourceBudget * 0.5) {
        return {
            isValid: false,
            error: 'Cannot shift more than 50% of source budget at once (safety limit)'
        };
    }

    // Minimum shift amount (avoid tiny shifts)
    if (amount < 100) {
        return { isValid: false, error: 'Minimum shift amount is $100' };
    }

    return { isValid: true };
}

/**
 * Validates ROAS value
 */
export function validateROAS(roas: number | string): ValidationResult {
    const num = typeof roas === 'string' ? parseFloat(roas) : roas;

    if (isNaN(num)) {
        return { isValid: false, error: 'ROAS must be a valid number' };
    }

    if (num < 0) {
        return { isValid: false, error: 'ROAS cannot be negative' };
    }

    if (num > 100) {
        return { isValid: false, error: 'ROAS value seems unusually high (>100x)' };
    }

    return { isValid: true };
}

/**
 * Validates email address
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
        return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
}

/**
 * Validates percentage value (0-100)
 */
export function validatePercentage(value: number | string): ValidationResult {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
        return { isValid: false, error: 'Percentage must be a valid number' };
    }

    if (num < 0 || num > 100) {
        return { isValid: false, error: 'Percentage must be between 0 and 100' };
    }

    return { isValid: true };
}

/**
 * Validates URL
 */
export function validateUrl(url: string): ValidationResult {
    if (!url || url.trim().length === 0) {
        return { isValid: false, error: 'URL is required' };
    }

    try {
        new URL(url);
        return { isValid: true };
    } catch {
        return { isValid: false, error: 'Invalid URL format' };
    }
}
