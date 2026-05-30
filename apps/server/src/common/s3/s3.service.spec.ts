import { S3Service } from './s3.service';

const sendMock = jest.fn();
const getSignedUrlMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: sendMock })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrlMock(...args),
}));

jest.mock('src/common/config', () => ({
  config: {
    s3: {
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      bucketName: 'test-bucket',
      region: 'us-east-1',
    },
  },
}));

describe('S3Service', () => {
  const service = new S3Service();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploadRecording sends PutObjectCommand', async () => {
    sendMock.mockResolvedValue({});
    await service.uploadRecording('recordings/u1/m1.mp4', Buffer.from('video'));
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'recordings/u1/m1.mp4',
          ContentType: 'video/mp4',
        }),
      })
    );
  });

  it('getPresignedRecordingUrl returns signed url', async () => {
    getSignedUrlMock.mockResolvedValue('https://signed.example/video.mp4');
    const url = await service.getPresignedRecordingUrl('recordings/u1/m1.mp4');
    expect(url).toBe('https://signed.example/video.mp4');
    expect(getSignedUrlMock).toHaveBeenCalled();
  });
});
