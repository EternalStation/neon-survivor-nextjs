/**
 * Formats large numbers with suffixes (K, M, B, T, Q, Qi, Sx, Sp, Oc, No, Dc)
 * Ensures concise display (max ~4-6 chars)
 */
export const formatLargeNumber = (num: number | string): string => {
    // Handle string inputs (parse if possible, return if not a number)
    let value = typeof num === 'string' ? parseFloat(num) : num;

    if (isNaN(value)) return '0';
    if (value < 1000) return Math.round(value).toLocaleString();

    const suffixes = [
        { val: 1e33, suffix: 'Dc' }, // Decillion
        { val: 1e30, suffix: 'No' }, // Nonillion
        { val: 1e27, suffix: 'Oc' }, // Octillion
        { val: 1e24, suffix: 'Sp' }, // Septillion
        { val: 1e21, suffix: 'Sx' }, // Sextillion
        { val: 1e18, suffix: 'Qi' }, // Quintillion
        { val: 1e15, suffix: 'Q' },  // Quadrillion
        { val: 1e12, suffix: 'T' },  // Trillion
        { val: 1e9, suffix: 'B' },   // Billion
        { val: 1e6, suffix: 'M' },   // Million
        { val: 1e3, suffix: 'K' }    // Thousand
    ];

    for (const { val, suffix } of suffixes) {
        if (value >= val) {
            return (value / val).toFixed(1) + suffix;
        }
    }

    return value.toLocaleString();
};
