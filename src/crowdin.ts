import Crowdin, { SourceFilesModel, TranslationsModel } from '@crowdin/crowdin-api-client';
import axios from 'axios';

/**
 *
 * @param arguments arguments
 * @param arguments.client crowdin client instance
 * @param arguments.projectId crowdin project id
 * @param arguments.name file name
 * @param arguments.title file title
 * @param arguments.type file type
 * @param arguments.directoryId directory id
 * @param arguments.data file data
 * @param arguments.file file object
 * @returns id of newly created or existing file id
 */
export async function updateOrCreateFile({
    client,
    projectId,
    name,
    title,
    type,
    directoryId,
    data,
    file,
}: {
    client: Crowdin;
    projectId: number;
    name: string;
    title?: string;
    type?: SourceFilesModel.FileType;
    directoryId?: number;
    data: any;
    file?: SourceFilesModel.File;
}): Promise<number> {
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
 * @param arguments arguments
 * @param arguments.directories all directories
 * @param arguments.client crowdin client instance
 * @param arguments.projectId project id
 * @param arguments.directoryName directory name to find
 * @param arguments.parentDirectory parent directory
 * @returns found folder (or undefined in case if directory for given name does not exists) and files under it
 */
export async function getFolder({
    directories,
    client,
    projectId,
    directoryName,
    parentDirectory,
}: {
    directories: SourceFilesModel.Directory[];
    client: Crowdin;
    projectId: number;
    directoryName: string;
    parentDirectory?: SourceFilesModel.Directory;
}): Promise<{ folder?: SourceFilesModel.Directory; files: SourceFilesModel.File[] }> {
    const folder = directories.find(
        d =>
            d.name === directoryName && ((!parentDirectory && !d.directoryId) || d.directoryId === parentDirectory?.id),
    );
    let files: SourceFilesModel.File[] = [];
    if (folder) {
        files = (
            await client.sourceFilesApi.withFetchAll().listProjectFiles(projectId, { directoryId: folder.id })
        ).data.map(e => e.data);
    }
    return { folder, files };
}

/**
 *
 * @param arguments arguments
 * @param arguments.directories all directories
 * @param arguments.client crowdin client instance
 * @param arguments.projectId project id
 * @param arguments.directoryName directory name to find
 * @param arguments.parentDirectory parent directory
 * @returns found or created folder and files under it
 */
export async function getOrCreateFolder({
    directories,
    client,
    projectId,
    directoryName,
    parentDirectory,
}: {
    directories: SourceFilesModel.Directory[];
    client: Crowdin;
    projectId: number;
    directoryName: string;
    parentDirectory?: SourceFilesModel.Directory;
}): Promise<{ folder: SourceFilesModel.Directory; files: SourceFilesModel.File[]; created: boolean }> {
    let { folder, files } = await getFolder({ directories, client, projectId, directoryName, parentDirectory });
    let created = false;
    if (!folder) {
        created = true;
        folder = (
            await client.sourceFilesApi.createDirectory(projectId, {
                name: directoryName,
                directoryId: parentDirectory ? parentDirectory.id : undefined,
            })
        ).data;
        files = (
            await client.sourceFilesApi.withFetchAll().listProjectFiles(projectId, { directoryId: folder.id })
        ).data.map(e => e.data);
    }
    return { folder, files, created };
}

/**
 *
 * @param arguments arguments
 * @param arguments.client crowdin client instance
 * @param arguments.projectId project id
 * @param arguments.fileId file id
 * @param arguments.language language id
 * @param arguments.fileName file name for upload storage request
 * @param arguments.fileContent file content
 * @param arguments.request extra request fields for upload translation request
 * @returns upload translation response
 */
export async function uploadTranslations({
    client,
    projectId,
    fileId,
    language,
    fileName,
    fileContent,
    request = {},
}: {
    client: Crowdin;
    projectId: number;
    fileId: number;
    language: string;
    fileName: string;
    fileContent: any;
    request: Omit<TranslationsModel.UploadTranslationRequest, 'fileId' | 'storageId'>;
}): Promise<TranslationsModel.UploadTranslationResponse> {
    const storage = await client.uploadStorageApi.addStorage(fileName, fileContent);
    return (
        await client.translationsApi.uploadTranslation(projectId, language, {
            fileId,
            storageId: storage.data.id,
            ...request,
        })
    ).data;
}

/**
 *
 * @param arguments arguments
 * @param arguments.client crowdin client instance
 * @param arguments.projectId project id
 * @param arguments.directory directory name where files are located
 * @param arguments.fileEntities files information
 * @param arguments.parentDirectory parent directory
 */
export async function updateSourceFiles({
    client,
    projectId,
    directory,
    fileEntities,
    parentDirectory,
}: {
    client: Crowdin;
    projectId: number;
    directory: string;
    fileEntities: FileEntity[];
    parentDirectory?: SourceFilesModel.Directory;
}): Promise<void> {
    const directories = await client.sourceFilesApi.withFetchAll().listProjectDirectories(projectId);

    const { folder, files } = await getOrCreateFolder({
        directories: directories.data.map(d => d.data),
        client,
        projectId,
        directoryName: directory,
        parentDirectory,
    });

    await Promise.all(
        fileEntities.map(
            async fileEntity =>
                await updateOrCreateFile({
                    client,
                    projectId,
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

/**
 *
 * @param arguments arguments
 * @param arguments.client crowdin client instance
 * @param arguments.projectId projecy id
 * @param arguments.directory directory name where source files are located
 * @param arguments.request request if file files and languages info
 * @param arguments.handleFn function that will be invoked for each translation file
 * @param arguments.parentDirectory parent directory
 */
export async function handleTranslations({
    client,
    projectId,
    directory,
    request,
    parentDirectory,
    handleFn,
}: {
    client: Crowdin;
    projectId: number;
    directory: string;
    request: TranslationsRequest;
    parentDirectory?: SourceFilesModel.Directory;
    handleFn: (translations: any, language: string, file: SourceFilesModel.File) => Promise<void>;
}): Promise<void> {
    const directories = await client.sourceFilesApi.withFetchAll().listProjectDirectories(projectId);

    const { files } = await getFolder({
        directories: directories.data.map(d => d.data),
        client,
        projectId,
        directoryName: directory,
        parentDirectory,
    });

    for (const [fileId, targetLanguages] of Object.entries(request)) {
        const file = files.find(f => f.id === parseInt(fileId));
        if (!file) {
            continue;
        }
        await Promise.all(
            targetLanguages.map(async languageCode => {
                const translationsLink = await client.translationsApi.buildProjectFileTranslation(projectId, file.id, {
                    targetLanguageId: languageCode,
                });

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
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        //@ts-ignore
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        //@ts-ignore
        if (e.response) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            //@ts-ignore
            if (e.response.status === 402) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                //@ts-ignore
                throw new PaymentRequiredError(e.response.data?.subscribeLink, e.response.data?.initializedAt);
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                //@ts-ignore
            } else if (e.response.data?.error?.message) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                //@ts-ignore
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
