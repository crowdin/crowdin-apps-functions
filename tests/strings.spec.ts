import { convertString } from '../src';

describe('Convert plurals', () => {
    it('ICU xlf source string', () => {
        const res = convertString(
            {
                plurals: 'icu',
                placeholders: 'xlf',
            },
            {
                hasPlurals: true,
                identifier: 'key',
                text: {
                    one: '[%word]',
                    other: '[%words]',
                },
            },
        );
        expect(res).toBe('{key, plural,  one {<x>word</x>} other {<x>words</x>}}');
    });

    it('ICU mustache translation', () => {
        const res = convertString(
            {
                plurals: 'icu',
                placeholders: 'mustache',
            },
            {
                hasPlurals: true,
                identifier: 'key',
                translations: {
                    uk: {
                        text: {
                            one: '[%word]',
                            other: '[%words]',
                        },
                    },
                },
            },
            'uk',
        );
        expect(res).toBe('{key, plural,  one {{word}} other {{words}}}');
    });

    it('Concat xlf source string', () => {
        const res = convertString(
            {
                plurals: 'concat',
                placeholders: 'xlf',
            },
            {
                hasPlurals: true,
                identifier: 'key',
                text: {
                    one: '[%word]',
                    other: '[%words]',
                },
            },
        );
        expect(res).toBe('<x>word</x>|<x>words</x>');
    });

    it('Concat mustache translation', () => {
        const res = convertString(
            {
                plurals: 'concat',
                placeholders: 'mustache',
            },
            {
                hasPlurals: true,
                identifier: 'key',
                translations: {
                    uk: {
                        text: {
                            one: '[%word]',
                            other: '[%words]',
                        },
                    },
                },
            },
            'uk',
        );
        expect(res).toBe('{word}|{words}');
    });

    it('Default mustache translation', () => {
        const res = convertString(
            {
                placeholders: 'mustache',
            },
            {
                hasPlurals: true,
                identifier: 'key',
                translations: {
                    uk: {
                        text: {
                            one: '[%word]',
                            other: '[%words]',
                        },
                    },
                },
            },
            'uk',
        );
        expect(res).toBe('["{word}","{words}"]');
    });
});

describe('Convert singular', () => {
    it('xlf source string', () => {
        const res = convertString(
            {
                placeholders: 'xlf',
            },
            {
                text: '[%word]',
            },
        );
        expect(res).toBe('<x>word</x>');
    });

    it('mustache translation', () => {
        const res = convertString(
            {
                placeholders: 'mustache',
            },
            {
                translations: {
                    uk: {
                        text: '[%word]',
                    },
                },
            },
            'uk',
        );
        expect(res).toBe('{word}');
    });
});
