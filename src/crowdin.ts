import Crowdin, { SourceFilesModel } from '@crowdin/crowdin-api-client';

//TODO add more

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
