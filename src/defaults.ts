interface Template {
    formSchema: {
        type: string;
        properties: {
            plurals: {
                type: string;
                title: string;
                enum: string[];
                enumNames: string[];
                default: string;
            };
            placeholders: {
                type: string;
                title: string;
                enum: string[];
                enumNames: string[];
                default: string;
            };
        };
    };
    formUiSchema: {
        plurals: {
            'ui:help': string;
        };
        placeholders: {
            'ui:help': string;
        };
    };
}

/**
 *
 * @returns UI template for custom formatters
 */
export function getBundleConfigurationForm(): Template {
    return {
        formSchema: {
            type: 'object',
            properties: {
                plurals: {
                    type: 'string',
                    title: 'Plurals Serialization',
                    enum: ['array', 'icu', 'concat'],
                    enumNames: ['JSON Array', 'ICU', 'Concat (with | as a separator)'],
                    default: 'array',
                },
                placeholders: {
                    type: 'string',
                    title: 'Placeholders Format',
                    enum: ['none', 'mustache', 'xlf'],
                    enumNames: ['None', 'Mustache ( {$1} )', 'XLIFF ( <x>$1</x> )'],
                    default: 'none',
                },
            },
        },
        formUiSchema: {
            plurals: {
                'ui:help': 'Use this option only if you have plural strings in your project.',
            },
            placeholders: {
                'ui:help':
                    'This option can only be used if you have enabled the "Unified placeholders" option in your Crowdin project. Use this field to configure your preferred format of placeholders in the resulting resource file.',
            },
        },
    };
}
