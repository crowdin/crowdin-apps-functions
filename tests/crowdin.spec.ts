import { updateOrCreateFile, getFolder } from '../src';
import Crowdin, {
    ResponseList,
    ResponseObject,
    SourceFiles,
    SourceFilesModel,
    UploadStorageModel,
} from '@crowdin/crowdin-api-client';
import { createMock } from 'ts-auto-mock';

describe('UpdateOrCreateFile function', () => {
    let client: Crowdin;
    let spyProjectId: number;
    let spyFileId: number;
    let spyRequest: SourceFilesModel.ReplaceFileFromStorageRequest | SourceFilesModel.RestoreFile;

    beforeEach(() => {
        client = createMock<Crowdin>({
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
    });

    it('should create file when source file is undefined', async () => {
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
        const file = createMock<SourceFilesModel.File>({
            id: 3,
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

describe('GetFolder function', () => {
    let client: Crowdin;
    let spyMaxLimit: number | undefined;
    let spyProjectId: number;
    let spyOptions: SourceFilesModel.ListProjectFilesOptions | undefined;
    let file: SourceFilesModel.File;
    const parentFolder = createMock<SourceFilesModel.Directory>({ name: 'parentFolder', id: 3 });

    beforeEach(() => {
        file = createMock<SourceFilesModel.File>();
        client = createMock<Crowdin>({
            sourceFilesApi: {
                withFetchAll: (maxLimit?: number): SourceFiles => {
                    spyMaxLimit = maxLimit;
                    const mock = createMock<SourceFiles>();
                    mock.listProjectFiles = ((
                        projectId: number,
                        options?: SourceFilesModel.ListProjectFilesOptions,
                    ): Promise<ResponseList<SourceFilesModel.File>> => {
                        spyProjectId = projectId;
                        spyOptions = options;
                        return new Promise<ResponseList<SourceFilesModel.File>>(resolve => {
                            resolve(
                                createMock<ResponseList<SourceFilesModel.File>>({
                                    data: [
                                        createMock<ResponseObject<SourceFilesModel.File>>({
                                            data: file,
                                        }),
                                    ],
                                }),
                            );
                        });
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    }) as any;
                    return mock;
                },
            },
        });
    });

    it('retrives folder and files in it', async () => {
        const folder = createMock<SourceFilesModel.Directory>({ name: 'directoryName', id: 2 });
        const directories = [folder];

        await getFolder(directories, client, 1, folder.name).then(result => {
            expect(result).toStrictEqual({ files: [file], folder: folder });
            expect(spyMaxLimit).toBe(undefined);
            expect(spyProjectId).toBe(1);
            expect(spyOptions).toStrictEqual({ directoryId: 2 });
        });
    });

    it('filters by parentFolder', async () => {
        const folder = createMock<SourceFilesModel.Directory>({
            name: 'directoryName',
            id: 2,
            directoryId: parentFolder.id,
        });

        const directories = [folder];
        await getFolder(directories, client, 1, folder.name, parentFolder).then(result => {
            expect(result).toStrictEqual({ files: [file], folder: folder });
            expect(spyMaxLimit).toBe(undefined);
            expect(spyProjectId).toBe(1);
            expect(spyOptions).toStrictEqual({ directoryId: 2 });
        });
    });
});
