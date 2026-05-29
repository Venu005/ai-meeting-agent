import { config } from 'src/common/config';
import { MastraClient } from './mastra.client';

jest.mock('src/common/config', () => ({
  config: {
    mastra: { url: 'http://localhost:4111' },
  },
}));

describe('MastraClient', () => {
  const fetchMock = jest.fn();
  const client = new MastraClient();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  it('calls start-async with runId and returns workflow result', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'success',
          result: {
            notes: 'Meeting notes',
            structuredDoc: 'Structured doc',
            keyPoints: ['Point A'],
          },
        }),
    });

    const result = await client.processMeeting(
      {
        transcript: 'Hello team',
        userRole: 'PRODUCT_MANAGER',
        meetingTitle: 'Sync',
      },
      'meeting-123'
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${config.mastra.url}/api/workflows/meetingProcessingWorkflow/start-async?runId=meeting-123`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          inputData: {
            transcript: 'Hello team',
            userRole: 'PRODUCT_MANAGER',
            meetingTitle: 'Sync',
          },
        }),
      })
    );
    expect(result).toEqual({
      notes: 'Meeting notes',
      structuredDoc: 'Structured doc',
      keyPoints: ['Point A'],
    });
  });
});
