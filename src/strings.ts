interface SerializationConfig {
    placeholders: 'xlf' | 'mustache';
    plurals?: 'icu' | 'concat';
}

type StringText = { [key: string]: string } | string;

interface InputString {
    translations?: {
        [languageId: string]: {
            text: StringText;
        };
    };
    text?: StringText;
    hasPlurals?: boolean;
    identifier?: string;
}

/**
 * Function to convert source or translation according to specified config
 *
 * @param config conversion settings
 * @param string string
 * @param languageId language id
 * @returns converted string
 */
export function convertString(
    config: SerializationConfig,
    string: InputString,
    languageId?: string,
): string | undefined {
    const text = !!languageId ? (string.translations || {})[languageId].text : string.text;

    if (string.hasPlurals && string.identifier && text) {
        return serializeICU(config, string.identifier, text);
    }

    if (typeof text === 'string') {
        return convertPlaceholders(config, text);
    }
}

function serializeICU(config: SerializationConfig, identifier: string, string: StringText): string {
    if (config.plurals === 'icu') {
        const pluralFormsTranslations = Object.entries(string)
            .map(([key, value]) => ` ${key} {${convertPlaceholders(config, value)}}`)
            .join('');

        return `{${identifier}, plural, ${pluralFormsTranslations}}`;
    }

    if (config.plurals === 'concat') {
        return Object.entries(string)
            .map(([, value]) => `${convertPlaceholders(config, value)}`)
            .join('|');
    }

    return JSON.stringify(Object.entries(string).map(([, value]) => convertPlaceholders(config, value)));
}

function convertPlaceholders(config: SerializationConfig, string: string): string {
    const regex = /\[%([^\]]+)]/gm;

    if (config.placeholders === 'mustache') {
        return string.replaceAll(regex, '{$1}');
    }

    if (config.placeholders === 'xlf') {
        return string.replaceAll(regex, '<x>$1</x>');
    }

    return string;
}
