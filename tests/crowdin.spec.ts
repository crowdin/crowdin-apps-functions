import { updateOrCreateFile } from '../src';
import Crowdin, { ResponseObject, SourceFilesModel, UploadStorageModel } from '@crowdin/crowdin-api-client';
import { createMock } from 'ts-auto-mock';
describe('UpdateOrCreateFile function', () => {
    it('should create file when source file is undefined', async () => {
        let spyProjectId: number;
        let spyRequest: SourceFilesModel.CreateFileRequest;
        const client = createMock<Crowdin>({
            uploadStorageApi: {
                addStorage: (): Promise<ResponseObject<UploadStorageModel.Storage>> => {
                    return createMock<Promise<ResponseObject<UploadStorageModel.Storage>>>();
                },
            },
            sourceFilesApi: {
                createFile: (
                    projectId: number,
                    request: SourceFilesModel.CreateFileRequest,
                ): Promise<ResponseObject<SourceFilesModel.File>> => {
                    spyProjectId = projectId;
                    spyRequest = request;
                    return createMock<Promise<ResponseObject<SourceFilesModel.File>>>();
                },
            },
        });
        await updateOrCreateFile(client, 1, 'name', 'title', 'auto', 2, null, undefined).then(result => {
            expect(result).toBe(0);
            expect(spyProjectId).toBe(1);
            expect(spyRequest).toStrictEqual({
                storageId: 0,
                name: 'name',
                title: 'title',
                type: 'auto',
                directoryId: 2,
            });
        });
    });
    it('should update file when source file is defined', async () => {
        let spyProjectId: number;
        let spyFileId: number;
        let spyRequest: SourceFilesModel.ReplaceFileFromStorageRequest | SourceFilesModel.RestoreFile;
        const file = createMock<SourceFilesModel.File>({
            id: 3,
        });
        const client = createMock<Crowdin>({
            uploadStorageApi: {
                addStorage: (): Promise<ResponseObject<UploadStorageModel.Storage>> => {
                    return createMock<Promise<ResponseObject<UploadStorageModel.Storage>>>();
                },
            },
            sourceFilesApi: {
                updateOrRestoreFile: (
                    projectId: number,
                    fileId: number,
                    request: SourceFilesModel.ReplaceFileFromStorageRequest | SourceFilesModel.RestoreFile,
                ): Promise<ResponseObject<SourceFilesModel.File>> => {
                    spyProjectId = projectId;
                    spyRequest = request;
                    spyFileId = fileId;
                    return createMock<Promise<ResponseObject<SourceFilesModel.File>>>();
                },
            },
        });
        await updateOrCreateFile(client, 1, 'name', 'title', 'auto', 2, null, file).then(result => {
            expect(result).toBe(3);
            expect(spyProjectId).toBe(1);
            expect(spyFileId).toBe(3);
            expect(spyRequest).toStrictEqual({
                storageId: 0,
            });
        });
    });
});
