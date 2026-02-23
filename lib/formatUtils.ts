
/**
 * Formats a number or string as BRL currency (R$ 1.234,56).
 */
export const displayCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return 'R$ 0,00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(num);
};

/**
 * Formats minutes or a duration string as HH:mm.
 * If input is "90", returns "01:30".
 */
export const displayDuration = (value: number | string | null | undefined): string => {
    if (!value) return '00:00';
    const totalMinutes = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(totalMinutes)) return '00:00';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Parses a HH:mm string back into total minutes.
 * If input is "01:30", returns 90.
 */
export const parseDurationToMinutes = (value: string): number => {
    if (!value || !value.includes(':')) return parseInt(value, 10) || 0;
    const [hours, minutes] = value.split(':').map(v => parseInt(v, 10) || 0);
    return (hours * 60) + minutes;
};

/**
 * Parses a BRL currency string (e.g. "1.234,56") into a numeric string (e.g. "1234.56").
 */
export const parseCurrencyToNumber = (value: string): string => {
    if (!value) return '0';
    // Remove dots (thousands) and replace comma with dot (decimal)
    return value.replace(/\./g, '').replace(',', '.');
};
