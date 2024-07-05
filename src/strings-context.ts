import Crowdin, {
    ProjectsGroupsModel,
    SourceStringsModel,
    StringTranslationsModel,
    TranslationMemoryModel,
    GlossariesModel,
    ScreenshotsModel,
} from '@crowdin/crowdin-api-client';
import axios from 'axios';
import * as path from 'path';
import ImageAnnotator from './util/image-annotator';

interface AdditionalNodes {
    otherLanguageTranslations: boolean;
    glossaryTerms: boolean;
    tmSuggestions: boolean;
    screenshots: boolean;
}

interface StringsContextArgs {
    client: Crowdin;
    projectId: number;
    stringIds: number[];
    targetLanguagesIds: string[];
    additionalNodes?: AdditionalNodes;
    stringsLimit?: number;
    translationsLimit?: number;
}

interface Variables {
    projectId: number;
    stringIds: number[];
    stringsLimit: number;
    languageIds: string[];
    translationsLimit?: number;
}

interface ExtendedStringNode extends SourceStringsModel.String {
    translations: {
        edges: {
            node: StringTranslationsModel.StringTranslation;
        }[];
    };
}

interface TranslationMemorySuggestion extends TranslationMemoryModel.ConcordanceSearchResponse {
    languageId: string;
}

interface AnnotatedScreenshot extends Partial<ScreenshotsModel.Screenshot> {
    originalUrl: string;
}

interface GetStringsContextResult {
    project: Partial<ProjectsGroupsModel.Project>;
    strings: ExtendedStringNode[];
    screenshots?: AnnotatedScreenshot[];
    tmSuggestions?: TranslationMemorySuggestion[];
    glossaryTerms?: GlossariesModel.ConcordanceSearchResponse[];
}

function buildQuery(additionalNodes: AdditionalNodes, getProjectData = true): string {
    return `
    query (
        $projectId: Int!
        $stringIds: [Int!]
        $stringsLimit: Int!
        ${additionalNodes.otherLanguageTranslations ? '$languageIds: [String!]' : ''},
        ${additionalNodes.otherLanguageTranslations ? '$translationsLimit: Int!' : ''},
    ) {
        viewer {
            projects(first: 1, filter: { id: { equals: $projectId } }) {
                edges {
                    node {
                        ${getProjectData ? '...ProjectFragment' : ''}
                        strings(first: $stringsLimit, filter: { id: { in: $stringIds } }) {
                            edges {
                                node {
                                    ... on PlainSourceString {
                                        id
                                        identifier
                                        text
                                        context
                                        maxLength
                                        file {
                                            ...FileFragment
                                        }
                                        ${
                                            additionalNodes?.otherLanguageTranslations
                                                ? `translations(first: $translationsLimit, filter: { languageId: { in: $languageIds } }) {
                                            edges {
                                                node {
                                                    id
                                                    text
                                                    language {
                                                        ...LanguageFragment
                                                    }
                                                }
                                            }
                                        }`
                                                : ''
                                        }
                                    }
                                    ... on PluralSourceString {
                                        id
                                        identifier
                                        plurals {
                                            zero
                                            one
                                            two
                                            few
                                            many
                                            other
                                        }
                                        context
                                        maxLength
                                        file {
                                            ...FileFragment
                                        }
                                        ${
                                            additionalNodes?.otherLanguageTranslations
                                                ? `translations(first: $translationsLimit, filter: { languageId: { in: $languageIds } }) {
                                            edges {
                                                node {
                                                    id
                                                    pluralForm
                                                    text
                                                    language {
                                                        ...LanguageFragment
                                                    }
                                                }
                                            }
                                        }`
                                                : ''
                                        }
                                    }
                                    ... on ICUSourceString {
                                        id
                                        identifier
                                        text
                                        context
                                        maxLength
                                        file {
                                            ...FileFragment
                                        }
                                        ${
                                            additionalNodes?.otherLanguageTranslations
                                                ? `translations(first: $translationsLimit, filter: { languageId: { in: $languageIds } }) {
                                            edges {
                                                node {
                                                    id
                                                    text
                                                    language {
                                                        ...LanguageFragment
                                                    }
                                                }
                                            }
                                        }`
                                                : ''
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        rateLimit {
            cost
            limit
            remaining
            resetAt
        }
    }
    
    fragment ProjectFragment on Project {
        id
        sourceLanguage {
            ...LanguageFragment
        }
        targetLanguages {
            ...LanguageFragment
        }
        name
        description
    }
    
    fragment LanguageFragment on Language {
        id
        name
        twoLettersCode
        threeLettersCode
        locale
        pluralCategoryNames
        pluralRules
        pluralExamples
        textDirection
        dialectOf {
            id
            name
            twoLettersCode
            threeLettersCode
            locale
            pluralCategoryNames
            pluralRules
            pluralExamples
            textDirection
        }
    }
    
    fragment FileFragment on File {
        id
        name
        title
        context
        type
        path
    }
    `;
}

async function fetchTranslationMemory(
    client: Crowdin,
    projectId: number,
    expressions: string[],
    sourceLanguageId: string,
    targetLanguagesIds: string[],
): Promise<TranslationMemorySuggestion[]> {
    const tmSuggestions: TranslationMemorySuggestion[] = [];

    for (const targetLanguageId of targetLanguagesIds) {
        const tmConcordanceSearchResult = await client.translationMemoryApi
            .withFetchAll()
            .concordanceSearch(projectId, {
                sourceLanguageId,
                targetLanguageId,
                autoSubstitution: false,
                minRelevant: 60,
                expressions,
            });

        for (const suggestion of tmConcordanceSearchResult.data) {
            tmSuggestions.push({
                ...suggestion.data,
                languageId: targetLanguageId,
            });
        }
    }

    return tmSuggestions;
}

async function fetchGlossaryTerms(
    client: Crowdin,
    projectId: number,
    expressions: string[],
    sourceLanguageId: string,
    targetLanguagesIds: string[],
): Promise<GlossariesModel.ConcordanceSearchResponse[]> {
    const glossaryTerms: GlossariesModel.ConcordanceSearchResponse[] = [];

    for (const targetLanguageId of targetLanguagesIds) {
        const glossaryConcordanceSearchResult = await client.glossariesApi.withFetchAll().concordanceSearch(projectId, {
            sourceLanguageId,
            targetLanguageId,
            expressions,
        });

        for (const term of glossaryConcordanceSearchResult.data) {
            const conceptId = term.data.concept.id;
            const { targetTerms, ...termData } = term.data;
            if (!glossaryTerms[conceptId]) {
                glossaryTerms[conceptId] = { ...termData, targetTerms: [] };
            }
            glossaryTerms[conceptId].targetTerms.push(...targetTerms);
        }
    }
    return Object.values(glossaryTerms);
}

async function fetchScreenshots(
    client: Crowdin,
    projectId: number,
    strings: ExtendedStringNode[],
): Promise<AnnotatedScreenshot[]> {
    const stringIds = strings.map(str => str.id);
    // @ts-expect-error: Waiting fo client update
    const screenshotsData = await client.screenshotsApi.withFetchAll().listScreenshots(projectId, {
        stringIds,
    });

    const annotatedScreenshots: AnnotatedScreenshot[] = [];

    for (const screenshot of screenshotsData.data) {
        const { id, url, tags, name, labels } = screenshot.data;

        const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imageResponse.data, 'binary');

        const tracks = tags
            .filter((tag: any) => stringIds.includes(tag.stringId))
            .map((tag: any) => {
                const stringNode = strings.find(str => str.id === tag.stringId);
                const text = stringNode ? (stringNode.text as string) : `ID: ${tag.stringId}`;
                return {
                    x: tag.position.x,
                    y: tag.position.y,
                    w: tag.position.width,
                    h: tag.position.height,
                    text,
                };
            });

        const annotator = new ImageAnnotator(buffer);
        const annotatedBuffer = await annotator.annotate(tracks);
        const extension = path.extname(url).split('?')[0]; // Handle URL query parameters

        // Create a base64 data URL for the annotated image
        const annotatedUrl = `data:image/${extension};base64,${annotatedBuffer.toString('base64')}`;

        annotatedScreenshots.push({
            id,
            name,
            labels,
            url: annotatedUrl,
            originalUrl: url,
        });
    }

    return annotatedScreenshots;
}

export async function getStringsContext(args: StringsContextArgs): Promise<GetStringsContextResult> {
    const {
        client,
        projectId,
        stringIds,
        targetLanguagesIds,
        additionalNodes = {
            otherLanguageTranslations: true,
            glossaryTerms: true,
            tmSuggestions: true,
            screenshots: true,
        },
        stringsLimit = 2,
        translationsLimit = 10,
    } = args;
    let project: Partial<ProjectsGroupsModel.Project> = {};
    let strings: ExtendedStringNode[] = [];
    const totalRequests = Math.ceil(stringIds.length / stringsLimit);
    const query = buildQuery(additionalNodes);

    for (let i = 0; i < totalRequests; i++) {
        const start = i * stringsLimit;
        const end = start + stringsLimit;
        const batchStringIds = stringIds.slice(start, end);

        const variables: Variables = {
            projectId,
            stringIds: batchStringIds,
            stringsLimit: batchStringIds.length,
            languageIds: targetLanguagesIds,
            translationsLimit,
        };

        const response: any = await client.graphql({ query, variables });
        const projectData = response.data.viewer.projects.edges[0].node;

        if (!project.id && projectData) {
            project = {
                id: projectData.id,
                name: projectData.name,
                description: projectData.description,
                sourceLanguage: projectData.sourceLanguage,
                targetLanguages: projectData.targetLanguages,
            };
        }

        const stringsData = projectData.strings.edges.map((edge: { node: ExtendedStringNode }) => {
            const { translations, ...restNode } = edge.node;
            return {
                ...restNode,
                ...(translations && {
                    translations: translations?.edges.map(
                        (translationEdge: { node: StringTranslationsModel.StringTranslation }) => translationEdge.node,
                    ),
                }),
            };
        });

        strings = strings.concat(stringsData);
    }

    const sourceLanguageId = project.sourceLanguage?.id || 'en';
    const stringTexts: string[] = strings.map(string => string.text as string);

    let tmSuggestions: TranslationMemorySuggestion[] = [];
    let glossaryTerms: GlossariesModel.ConcordanceSearchResponse[] = [];
    let screenshots: AnnotatedScreenshot[] = [];

    if (additionalNodes.tmSuggestions && strings.length > 0) {
        tmSuggestions = await fetchTranslationMemory(
            client,
            projectId,
            stringTexts,
            sourceLanguageId,
            targetLanguagesIds,
        );
    }

    if (additionalNodes.glossaryTerms && strings.length > 0) {
        glossaryTerms = await fetchGlossaryTerms(client, projectId, stringTexts, sourceLanguageId, targetLanguagesIds);
    }

    if (additionalNodes.screenshots && strings.length > 0) {
        screenshots = await fetchScreenshots(client, projectId, strings);
    }

    return {
        project,
        strings,
        ...(screenshots.length > 0 && { screenshots }),
        ...(Object.keys(tmSuggestions).length > 0 && { tmSuggestions }),
        ...(Object.keys(glossaryTerms).length > 0 && { glossaryTerms }),
    };
}
