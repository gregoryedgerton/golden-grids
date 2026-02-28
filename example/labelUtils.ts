export type LabelMode = 'ROMAN NUMERALS' | 'ALPHABET' | 'INTEGERS' | 'NOTHING';
export const LABEL_MODES: LabelMode[] = ['ROMAN NUMERALS', 'ALPHABET', 'INTEGERS', 'NOTHING'];

export function toRoman(n: number): string {
    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    for (let i = 0; i < vals.length; i++) {
        while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
    }
    return result;
}

// Bijective base-26: 1→A, 26→Z, 27→AA, 52→AZ, 53→BA, 702→ZZ, 703→AAA
export function toAlpha(n: number): string {
    let result = '';
    while (n > 0) {
        n--;
        result = String.fromCharCode(65 + (n % 26)) + result;
        n = Math.floor(n / 26);
    }
    return result;
}

// Returns the label string (no period) or '' for NOTHING
export function getLabel(n: number, mode: LabelMode): string {
    switch (mode) {
        case 'ROMAN NUMERALS': return toRoman(n);
        case 'ALPHABET':       return toAlpha(n);
        case 'INTEGERS':       return String(n);
        case 'NOTHING':        return '';
    }
}
