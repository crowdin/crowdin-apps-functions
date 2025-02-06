import Crowdin, { ReportsModel, SourceFilesModel, TranslationsModel, WebhooksModel } from '@crowdin/crowdin-api-client';
import axios from 'axios';
import { PatchRequest } from '@crowdin/crowdin-api-client/out/core';

interface UpdateOrCreateFileArgs {
    client: Crowdin;
    projectId: number;
    name: string;
    title?: string;
    type?: SourceFilesModel.FileType;
    directoryId?: number;
    data: any;
    file?: SourceFilesModel.File;
    excludedTargetLanguages?: string[];
}

function isUpdateOrCreateFileArgs(arg: Crowdin | UpdateOrCreateFileArgs): arg is UpdateOrCreateFileArgs {
    // @ts-expect-error: Type guard property check
    return arg.client && arg.projectId;
}

/**
 *
 * @param client crowdin client instance
 * @param projectId crowdin project id
 * @param name file name
 * @param title file title
 * @param type file type
 * @param directoryId directory id
 * @param data file data
 * @param file file object
 * @param excludedTargetLanguages languages to be excluded from translation
 * @returns id of newly created or existing file id
 */
export async function updateOrCreateFile(
    client: Crowdin,
    projectId: number,
    name: string,
    title: string,
    type: SourceFilesModel.FileType,
    directoryId: number,
    data: any,
    file?: SourceFilesModel.File,
    excludedTargetLanguages?: string[],
): Promise<number>;

export async function updateOrCreateFile(args: UpdateOrCreateFileArgs): Promise<number>;

export async function updateOrCreateFile(
    clientOrArgs: Crowdin | UpdateOrCreateFileArgs,
    projectId?: number,
    name?: string,
    title?: string,
    type?: SourceFilesModel.FileType,
    directoryId?: number,
    data?: any,
    file?: SourceFilesModel.File,
    excludedTargetLanguages?: string[],
): Promise<number> {
    let options: UpdateOrCreateFileArgs;
    if (isUpdateOrCreateFileArgs(clientOrArgs)) {
        options = clientOrArgs;
    } else {
        options = {
            client: clientOrArgs,
            // @ts-expect-error: Handling potential undefined value
            projectId,
            // @ts-expect-error: Handling potential undefined value
            name,
            title,
            type,
            directoryId,
            data,
            file,
            excludedTargetLanguages,
        };
    }
    const storageFile = await options.client.uploadStorageApi.addStorage(options.name, options.data);
    if (options.file) {
        await options.client.sourceFilesApi.updateOrRestoreFile(options.projectId, options.file.id, {
            storageId: storageFile.data.id,
        });

        const updates: PatchRequest[] = [];

        if (options.title && options.title !== options.file.title) {
            updates.push({
                value: options.title,
                op: 'replace',
                path: '/title',
            });
        }

        if (options.excludedTargetLanguages) {
            updates.push({
                value: options.excludedTargetLanguages,
                op: 'replace',
                path: '/excludedTargetLanguages',
            });
        }

        if (updates.length > 0) {
            await options.client.sourceFilesApi.editFile(options.projectId, options.file.id, updates);
        }

        return options.file.id;
    } else {
        const newFile = await options.client.sourceFilesApi.createFile(options.projectId, {
            storageId: storageFile.data.id,
            name: options.name,
            title: options.title,
            type: options.type,
            directoryId: options.directoryId,
            excludedTargetLanguages: options.excludedTargetLanguages,
        });

        return newFile.data.id;
    }
}

interface GetFolderArgs {
    directories: SourceFilesModel.Directory[];
    client: Crowdin;
    projectId: number;
    directoryName: string;
    parentDirectory?: SourceFilesModel.Directory;
}

function isGetFolderArgs(arg: GetFolderArgs | SourceFilesModel.Directory[]): arg is GetFolderArgs {
    return !Array.isArray(arg);
}

/**
 *
 * @param directories all directories
 * @param crowdinClient crowdin client instance
 * @param projectId project id
 * @param directoryName directory name to find
 * @param parentDirectory parent directory
 * @returns found folder (or undefined in case if directory for given name does not exists) and files under it
 */
export async function getFolder(
    directories: SourceFilesModel.Directory[],
    crowdinClient: Crowdin,
    projectId: number,
    directoryName: string,
    parentDirectory?: SourceFilesModel.Directory,
): Promise<{ folder?: SourceFilesModel.Directory; files: SourceFilesModel.File[] }>;

export async function getFolder(
    args: GetFolderArgs,
): Promise<{ folder?: SourceFilesModel.Directory; files: SourceFilesModel.File[] }>;

export async function getFolder(
    directoriesOrArgs: SourceFilesModel.Directory[] | GetFolderArgs,
    crowdinClient?: Crowdin,
    projectId?: number,
    directoryName?: string,
    parentDirectory?: SourceFilesModel.Directory,
): Promise<{ folder?: SourceFilesModel.Directory; files: SourceFilesModel.File[] }> {
    let args: GetFolderArgs;
    if (isGetFolderArgs(directoriesOrArgs)) {
        args = directoriesOrArgs;
    } else {
        // @ts-expect-error: Handling potential undefined value
        args = { directories: directoriesOrArgs, client: crowdinClient, projectId, directoryName, parentDirectory };
    }
    const folder = args.directories.find(
        d =>
            d.name === args.directoryName &&
            ((!args.parentDirectory && !d.directoryId) || d.directoryId === args.parentDirectory?.id),
    );
    let files: SourceFilesModel.File[] = [];
    if (folder) {
        files = (
            await args.client.sourceFilesApi.withFetchAll().listProjectFiles(args.projectId, { directoryId: folder.id })
        ).data.map(e => e.data);
    }
    return { folder, files };
}

interface GetOrCreateFolderArgs {
    directories: SourceFilesModel.Directory[];
    client: Crowdin;
    projectId: number;
    directoryName: string;
    parentDirectory?: SourceFilesModel.Directory;
}

function isGetOrCreateFolderArgs(
    args: GetOrCreateFolderArgs | SourceFilesModel.Directory[],
): args is GetOrCreateFolderArgs {
    return !Array.isArray(args);
}

/**
 *
 * @param directories all directories
 * @param crowdinClient crowdin client instance
 * @param projectId project id
 * @param directoryName directory name to find
 * @param parentDirectory parent directory
 * @returns found or created folder and files under it
 */
export async function getOrCreateFolder(
    directories: SourceFilesModel.Directory[],
    crowdinClient: Crowdin,
    projectId: number,
    directoryName: string,
    parentDirectory?: SourceFilesModel.Directory,
): Promise<{ folder: SourceFilesModel.Directory; files: SourceFilesModel.File[]; created: boolean }>;

export async function getOrCreateFolder(
    args: GetFolderArgs,
): Promise<{ folder: SourceFilesModel.Directory; files: SourceFilesModel.File[]; created: boolean }>;

export async function getOrCreateFolder(
    directoriesOrArgs: SourceFilesModel.Directory[] | GetOrCreateFolderArgs,
    crowdinClient?: Crowdin,
    projectId?: number,
    directoryName?: string,
    parentDirectory?: SourceFilesModel.Directory,
): Promise<{ folder: SourceFilesModel.Directory; files: SourceFilesModel.File[]; created: boolean }> {
    let args: GetOrCreateFolderArgs;
    if (isGetOrCreateFolderArgs(directoriesOrArgs)) {
        args = directoriesOrArgs;
    } else {
        // @ts-expect-error: Handling potential undefined value
        args = { directories: directoriesOrArgs, client: crowdinClient, projectId, directoryName, parentDirectory };
    }
    let { folder, files } = await getFolder(args);
    let created = false;
    if (!folder) {
        created = true;
        folder = (
            await args.client.sourceFilesApi.createDirectory(args.projectId, {
                name: args.directoryName,
                directoryId: args.parentDirectory ? args.parentDirectory.id : undefined,
            })
        ).data;
        files = (
            await args.client.sourceFilesApi.withFetchAll().listProjectFiles(args.projectId, { directoryId: folder.id })
        ).data.map(e => e.data);
    }
    return { folder, files, created };
}

interface UploadTranslationsArgs {
    client: Crowdin;
    projectId: number;
    fileId: number;
    language: string;
    fileName: string;
    fileContent: any;
    request?: Omit<TranslationsModel.UploadTranslationRequest, 'fileId' | 'storageId'>;
}

function isUploadTranslationsArgs(args: UploadTranslationsArgs | Crowdin): args is UploadTranslationsArgs {
    // @ts-expect-error: Type guard property check
    return args.client && args.projectId;
}

/**
 *
 * @param crowdinClient crowdin client instance
 * @param projectId project id
 * @param fileId file id
 * @param language language id
 * @param fileName file name for upload storage request
 * @param fileContent file content
 * @param request extra request fields for upload translation request
 * @returns upload translation response
 */
export async function uploadTranslations(
    crowdinClient: Crowdin,
    projectId: number,
    fileId: number,
    language: string,
    fileName: string,
    fileContent: any,
    request?: Omit<TranslationsModel.UploadTranslationRequest, 'fileId' | 'storageId'>,
): Promise<TranslationsModel.UploadTranslationResponse>;

export async function uploadTranslations(
    args: UploadTranslationsArgs,
): Promise<TranslationsModel.UploadTranslationResponse>;

export async function uploadTranslations(
    crowdinClientOrArgs: Crowdin | UploadTranslationsArgs,
    projectId?: number,
    fileId?: number,
    language?: string,
    fileName?: string,
    fileContent?: any,
    request?: Omit<TranslationsModel.UploadTranslationRequest, 'fileId' | 'storageId'>,
): Promise<TranslationsModel.UploadTranslationResponse> {
    let args: UploadTranslationsArgs;
    if (isUploadTranslationsArgs(crowdinClientOrArgs)) {
        args = crowdinClientOrArgs;
    } else {
        // @ts-expect-error: Handling potential undefined value
        args = { client: crowdinClientOrArgs, projectId, fileId, fileContent, fileName, language, request };
    }
    const storage = await args.client.uploadStorageApi.addStorage(args.fileName, args.fileContent);
    return (
        await args.client.translationsApi.uploadTranslation(args.projectId, args.language, {
            fileId: args.fileId,
            storageId: storage.data.id,
            ...(args.request || {}),
        })
    ).data;
}

interface UpdateSourceFilesArgs {
    client: Crowdin;
    projectId: number;
    directory: string;
    fileEntities: FileEntity[];
    parentDirectory?: SourceFilesModel.Directory;
}

function isUpdateSourceFilesArgs(args: UpdateSourceFilesArgs | Crowdin): args is UpdateSourceFilesArgs {
    // @ts-expect-error: Type guard property check
    return args.client && args.projectId;
}

/**
 *
 * @param crowdinClient crowdin client instance
 * @param projectId project id
 * @param directory directory name where files are located
 * @param fileEntities files information
 * @param parentDirectory parent directory
 */
export async function updateSourceFiles(
    crowdinClient: Crowdin,
    projectId: number,
    directory: string,
    fileEntities: FileEntity[],
    parentDirectory?: SourceFilesModel.Directory,
): Promise<void>;

export async function updateSourceFiles(args: UpdateSourceFilesArgs): Promise<void>;

export async function updateSourceFiles(
    crowdinClientOrArgs: Crowdin | UpdateSourceFilesArgs,
    projectId?: number,
    directory?: string,
    fileEntities?: FileEntity[],
    parentDirectory?: SourceFilesModel.Directory,
): Promise<void> {
    let args: UpdateSourceFilesArgs;
    if (isUpdateSourceFilesArgs(crowdinClientOrArgs)) {
        args = crowdinClientOrArgs;
    } else {
        // @ts-expect-error: Handling potential undefined value
        args = { client: crowdinClientOrArgs, projectId, directory, fileEntities, parentDirectory };
    }
    const directories = await args.client.sourceFilesApi.withFetchAll().listProjectDirectories(args.projectId);

    const { folder, files } = await getOrCreateFolder({
        directories: directories.data.map(d => d.data),
        client: args.client,
        projectId: args.projectId,
        directoryName: args.directory,
        parentDirectory: args.parentDirectory,
    });

    await Promise.all(
        args.fileEntities.map(
            async fileEntity =>
                await updateOrCreateFile({
                    client: args.client,
                    projectId: args.projectId,
                    name: fileEntity.name,
                    title: fileEntity.title,
                    type: fileEntity.type,
                    directoryId: folder.id,
                    data: fileEntity.data,
                    file: files.find(f => f.name === fileEntity.name),
                }),
        ),
    );
}

interface HandleTranslationsArgs {
    client: Crowdin;
    projectId: number;
    directory: string;
    request: TranslationsRequest;
    parentDirectory?: SourceFilesModel.Directory;
    handleFn: (translations: any, language: string, file: SourceFilesModel.File) => Promise<void>;
}

function isHandleTranslationsArgs(args: HandleTranslationsArgs | Crowdin): args is HandleTranslationsArgs {
    // @ts-expect-error: Type guard property check
    return args.client && args.projectId;
}

/**
 *
 * @param crowdinClient crowdin client instance
 * @param projectId projecy id
 * @param directory directory name where source files are located
 * @param request request if file files and languages info
 * @param handleFn function that will be invoked for each translation file
 * @param parentDirectory parent directory
 */
export async function handleTranslations(
    crowdinClient: Crowdin,
    projectId: number,
    directory: string,
    request: TranslationsRequest,
    handleFn: (translations: any, language: string, file: SourceFilesModel.File) => Promise<void>,
    parentDirectory?: SourceFilesModel.Directory,
): Promise<void>;

export async function handleTranslations(args: HandleTranslationsArgs): Promise<void>;

export async function handleTranslations(
    crowdinClientOrArgs: Crowdin | HandleTranslationsArgs,
    projectId?: number,
    directory?: string,
    request?: TranslationsRequest,
    handleFn?: (translations: any, language: string, file: SourceFilesModel.File) => Promise<void>,
    parentDirectory?: SourceFilesModel.Directory,
): Promise<void> {
    let args: HandleTranslationsArgs;
    if (isHandleTranslationsArgs(crowdinClientOrArgs)) {
        args = crowdinClientOrArgs;
    } else {
        // @ts-expect-error: Handling potential undefined value
        args = { client: crowdinClientOrArgs, projectId, directory, handleFn, request, parentDirectory };
    }
    const directories = await args.client.sourceFilesApi.withFetchAll().listProjectDirectories(args.projectId);

    const { files } = await getFolder({
        directories: directories.data.map(d => d.data),
        client: args.client,
        projectId: args.projectId,
        directoryName: args.directory,
        parentDirectory: args.parentDirectory,
    });

    for (const [fileId, targetLanguages] of Object.entries(args.request)) {
        const file = files.find(f => f.id === parseInt(fileId));
        if (!file) {
            continue;
        }
        await Promise.all(
            targetLanguages.map(async languageCode => {
                const translationsLink = await args.client.translationsApi.buildProjectFileTranslation(
                    args.projectId,
                    file.id,
                    {
                        targetLanguageId: languageCode,
                    },
                );

                if (!translationsLink) {
                    return;
                }

                const response = await axios.get(translationsLink.data.url);

                await args.handleFn(response.data, languageCode, file);
            }),
        );
    }
}

interface CreateOrUpdateWebhookArgs {
    client: Crowdin;
    projectId: number;
    url: string;
    events: WebhooksModel.Event[];
    payload: any;
    name: string;
    requestType?: WebhooksModel.RequestType;
    batchingEnabled?: boolean;
    headers?: Record<string, string>;
    contentType?: WebhooksModel.ContentType;
    webhookId?: number;
    webhookMatch?: (webhook: WebhooksModel.Webhook) => boolean;
}

/**
 * Function to update or create webhook
 *
 * @returns updated or created webhook id
 */
export async function createOrUpdateWebhook(args: CreateOrUpdateWebhookArgs): Promise<number> {
    const {
        client,
        projectId,
        events,
        name,
        url,
        payload,
        requestType = 'POST',
        batchingEnabled = true,
        headers,
        contentType,
        webhookId,
        webhookMatch,
    } = args;
    let id = webhookId;
    if (webhookMatch) {
        const webhooks = await client.webhooksApi.withFetchAll().listWebhooks(projectId);
        const webhook = webhooks.data.find(e => webhookMatch(e.data));
        if (webhook) {
            id = webhook.data.id;
        }
    }
    if (id) {
        await client.webhooksApi.editWebhook(projectId, id, [
            {
                value: events,
                op: 'replace',
                path: '/events',
            },
            {
                value: payload,
                op: 'replace',
                path: '/payload',
            },
            {
                value: url,
                op: 'replace',
                path: '/url',
            },
        ]);
        return id;
    } else {
        const newWebhook = await client.webhooksApi.addWebhook(projectId, {
            name,
            url,
            events,
            requestType,
            payload,
            batchingEnabled,
            headers,
            contentType,
        });
        return newWebhook.data.id;
    }
}

export class PaymentRequiredError extends Error {
    public subscribeLink: string;
    public initializedAt: string;
    constructor(subscribeLink: string, initializedAt: string) {
        super('Payment required');
        this.subscribeLink = subscribeLink;
        this.initializedAt = initializedAt;
        // @ts-expect-error: Adding custom property
        this.code = 402;
    }
}

/**
 *
 * @param param0.appIdentifier method request
 * @param param0.token bearer token
 * @param param0.organization crowdin organization
 */
export async function getSubscription({
    appIdentifier,
    token,
    organization,
    baseUrl,
}: SubscriptionRequest): Promise<Subscription> {
    let requestUrl;
    if (baseUrl) {
        requestUrl = `${baseUrl}/api/v2/applications/${appIdentifier}/subscription`;
    } else if (!!organization) {
        requestUrl = `https://${organization}.api.crowdin.com/api/v2/applications/${appIdentifier}/subscription`;
    } else {
        requestUrl = `https://crowdin.com/api/v2/applications/${appIdentifier}/subscription`;
    }
    try {
        const response = await axios.get<Subscription>(requestUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        const e = error as any;
        if (e.response) {
            if (e.response.status === 402) {
                throw new PaymentRequiredError(e.response.data?.subscribeLink, e.response.data?.initializedAt);
            } else if (e.response.data?.error?.message) {
                throw new Error(e.response.data.error.message);
            }
        }
        throw e;
    }
}

export async function generateReport({
    client,
    projectId,
    request,
}: {
    client: Crowdin;
    projectId: number;
    request: ReportsModel.GenerateReportRequest;
}): Promise<any | undefined> {
    const report = await client.reportsApi.generateReport(projectId, request);

    while (true) {
        const status = await client.reportsApi.checkReportStatus(projectId, report.data.identifier);

        if (status.data.status === 'finished') {
            const downloadRes = await client.reportsApi.downloadReport(projectId, report.data.identifier);

            const reportBlob = await axios.get(downloadRes.data.url);
            return reportBlob.data;
        }
    }
}

export interface FileEntity {
    name: string;
    title: string;
    type: SourceFilesModel.FileType;
    data: any;
}

export interface TranslationsRequest {
    [fileId: string]: string[];
}

export interface SubscriptionRequest {
    token: string;
    organization?: string;
    appIdentifier: string;
    baseUrl?: string;
}

export interface Subscription {
    expires: string;
}
