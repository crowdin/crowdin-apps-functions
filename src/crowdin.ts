import Crowdin, { SourceFilesModel } from '@crowdin/crowdin-api-client';

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
            await crowdinClient.sourceFilesApi.withFetchAll().listProjectFiles(projectId, undefined, folder.id)
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
            await crowdinClient.sourceFilesApi.withFetchAll().listProjectFiles(projectId, undefined, folder.id)
        ).data.map(e => e.data);
    }
    return { folder, files, created };
}
