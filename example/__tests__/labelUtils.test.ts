import { toRoman, toAlpha, getLabel, LabelMode } from '../labelUtils';

describe('toRoman', () => {
    test.each([
        [1, 'I'],
        [4, 'IV'],
        [9, 'IX'],
        [14, 'XIV'],
        [40, 'XL'],
        [90, 'XC'],
        [399, 'CCCXCIX'],
        [1000, 'M'],
    ])('toRoman(%i) → %s', (n, expected) => {
        expect(toRoman(n)).toBe(expected);
    });
});

describe('toAlpha', () => {
    test.each([
        [1, 'A'],
        [26, 'Z'],
        [27, 'AA'],
        [52, 'AZ'],
        [53, 'BA'],
        [702, 'ZZ'],
        [703, 'AAA'],
    ])('toAlpha(%i) → %s', (n, expected) => {
        expect(toAlpha(n)).toBe(expected);
    });
});

describe('getLabel', () => {
    const modes: LabelMode[] = ['ROMAN NUMERALS', 'THE ALPHABET', 'INTEGERS', 'NOTHING'];

    test('ROMAN NUMERALS returns roman numeral', () => {
        expect(getLabel(1, 'ROMAN NUMERALS')).toBe('I');
        expect(getLabel(27, 'ROMAN NUMERALS')).toBe('XXVII');
    });

    test('THE ALPHABET returns bijective base-26 letter', () => {
        expect(getLabel(1, 'THE ALPHABET')).toBe('A');
        expect(getLabel(27, 'THE ALPHABET')).toBe('AA');
    });

    test('INTEGERS returns string integer', () => {
        expect(getLabel(1, 'INTEGERS')).toBe('1');
        expect(getLabel(27, 'INTEGERS')).toBe('27');
    });

    test('NOTHING always returns empty string', () => {
        for (const mode of modes) {
            if (mode === 'NOTHING') {
                expect(getLabel(1, mode)).toBe('');
                expect(getLabel(27, mode)).toBe('');
            }
        }
    });
});
