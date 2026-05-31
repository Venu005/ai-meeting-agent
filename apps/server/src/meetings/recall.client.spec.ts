import { RecallClient } from './recall.client';

describe('RecallClient.getBotRecordingDownloadUrl', () => {
  const client = new RecallClient();
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock;
    jest.clearAllMocks();
  });

  it('returns video_mixed download_url from bot response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'bot-1',
          recordings: [
            {
              media_shortcuts: {
                video_mixed: { data: { download_url: 'https://recall.example/video.mp4' } },
              },
            },
          ],
        }),
    });

    const url = await client.getBotRecordingDownloadUrl('bot-1');
    expect(url).toBe('https://recall.example/video.mp4');
  });

  it('returns null when video_mixed missing', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'bot-1', recordings: [{}] }),
    });

    expect(await client.getBotRecordingDownloadUrl('bot-1')).toBeNull();
  });
});
