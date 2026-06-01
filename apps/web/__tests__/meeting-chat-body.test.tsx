import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import MeetingChatBody from '@/components/meetings/MeetingChatBody';
import MeetingSideChat from '@/components/meetings/MeetingSideChat';

jest.mock('lucide-react', () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />;

  return {
    Bot: Icon,
    Loader2: Icon,
    Send: Icon,
    User: Icon,
    Trash2: Icon,
  };
});

describe('MeetingChatBody', () => {
  it('locks input while disabled', () => {
    const onInputChange = jest.fn();
    const onSend = jest.fn();

    render(
      <MeetingChatBody
        messages={[]}
        input=''
        onInputChange={onInputChange}
        onSend={onSend}
        isSending={false}
        isDisabled={true}
        disabledReason='Meeting is still processing.'
      />,
    );

    expect(screen.getByText('Meeting is still processing.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask about this meeting...')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('allows sending when enabled', () => {
    const onInputChange = jest.fn();
    const onSend = jest.fn();

    render(
      <MeetingChatBody
        messages={[]}
        input='What are the action items?'
        onInputChange={onInputChange}
        onSend={onSend}
        isSending={false}
        isDisabled={false}
        disabledReason={null}
      />,
    );

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeEnabled();

    fireEvent.click(sendButton);
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});

describe('MeetingSideChat', () => {
  it('calls clear handler when clear action is confirmed', () => {
    const onClearChat = jest.fn();

    render(
      <MeetingSideChat
        messages={[
          {
            id: 'm-1',
            role: 'assistant',
            content: 'Hello!',
          },
        ]}
        input=''
        onInputChange={jest.fn()}
        onSend={jest.fn()}
        isSending={false}
        isDisabled={false}
        disabledReason={null}
        onClearChat={onClearChat}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /clear chat/i }));
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));

    expect(onClearChat).toHaveBeenCalledTimes(1);
  });
});
