// @ts-nocheck
import Crowdin, { SourceFilesModel, TranslationsModel } from '@crowdin/crowdin-api-client';
import axios from 'axios';

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
): Promise<number> {
    const storageFile = await client.uploadStorageApi.addStorage(name, data);
    if (file) {
        await client.sourceFilesApi.updateOrRestoreFile(projectId, file.id, { storageId: storageFile.data.id });
        return file.id;
    } else {
        const newFile = await client.sourceFilesApi.createFile(projectId, {
            storageId: storageFile.data.id,
            name,
            title,
            type,
            directoryId,
        });
        return newFile.data.id;
    }
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
): Promise<{ folder?: SourceFilesModel.Directory; files: SourceFilesModel.File[] }> {
    const folder = directories.find(
        d =>
            d.name === directoryName && ((!parentDirectory && !d.directoryId) || d.directoryId === parentDirectory?.id),
    );
    let files: SourceFilesModel.File[] = [];
    if (folder) {
        files = (
            await crowdinClient.sourceFilesApi.withFetchAll().listProjectFiles(projectId, { directoryId: folder.id })
        ).data.map(e => e.data);
    }
    return { folder, files };
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
): Promise<{ folder: SourceFilesModel.Directory; files: SourceFilesModel.File[]; created: boolean }> {
    let { folder, files } = await getFolder(directories, crowdinClient, projectId, directoryName, parentDirectory);
    let created = false;
    if (!folder) {
        created = true;
        folder = (
            await crowdinClient.sourceFilesApi.createDirectory(projectId, {
                name: directoryName,
                directoryId: parentDirectory ? parentDirectory.id : undefined,
            })
        ).data;
        files = (
            await crowdinClient.sourceFilesApi.withFetchAll().listProjectFiles(projectId, { directoryId: folder.id })
        ).data.map(e => e.data);
    }
    return { folder, files, created };
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
    request: Omit<TranslationsModel.UploadTranslationRequest, 'fileId' | 'storageId'> = {},
): Promise<TranslationsModel.UploadTranslationResponse> {
    const storage = await crowdinClient.uploadStorageApi.addStorage(fileName, fileContent);
    return (
        await crowdinClient.translationsApi.uploadTranslation(projectId, language, {
            fileId,
            storageId: storage.data.id,
            ...request,
        })
    ).data;
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
): Promise<void> {
    const directories = await crowdinClient.sourceFilesApi.withFetchAll().listProjectDirectories(projectId);

    const { folder, files } = await getOrCreateFolder(
        directories.data.map(d => d.data),
        crowdinClient,
        projectId,
        directory,
        parentDirectory,
    );

    await Promise.all(
        fileEntities.map(
            async fileEntity =>
                await updateOrCreateFile(
                    crowdinClient,
                    projectId,
                    fileEntity.name,
                    fileEntity.title,
                    fileEntity.type,
                    folder.id,
                    fileEntity.data,
                    files.find(f => f.name === fileEntity.name),
                ),
        ),
    );
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
): Promise<void> {
    const directories = await crowdinClient.sourceFilesApi.withFetchAll().listProjectDirectories(projectId);

    const { files } = await getFolder(
        directories.data.map(d => d.data),
        crowdinClient,
        projectId,
        directory,
        parentDirectory,
    );

    for (const [fileId, targetLanguages] of Object.entries(request)) {
        const file = files.find(f => f.id === parseInt(fileId));
        if (!file) {
            continue;
        }
        await Promise.all(
            targetLanguages.map(async languageCode => {
                const translationsLink = await crowdinClient.translationsApi.buildProjectFileTranslation(
                    projectId,
                    file.id,
                    { targetLanguageId: languageCode },
                );

                if (!translationsLink) {
                    return;
                }

                const response = await axios.get(translationsLink.data.url);

                await handleFn(response.data, languageCode, file);
            }),
        );
    }
}

export class PaymentRequiredError extends Error {
    public subscribeLink: string;
    public initializedAt: string;
    constructor(subscribeLink: string, initializedAt: string) {
        super('Payment required');
        this.subscribeLink = subscribeLink;
        this.initializedAt = initializedAt;
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
    } catch (e) {
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
