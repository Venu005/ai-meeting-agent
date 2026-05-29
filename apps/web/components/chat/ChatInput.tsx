import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { Check, Loader, Loader2, Mic, Send, X } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { UIMessage, UseChatHelpers } from '@ai-sdk/react';
import { useIsMobile } from '@repo/ui/hooks/use-mobile';
import { useChatTransition } from '@/hooks/useChatTransition';
import { toast } from 'sonner';
import { useCreateTranscript } from '@/queries/chat';
import { LiveWaveform } from '@repo/ui/components/live-waveform';

interface ChatInputProps {
  isSubmitting: boolean;
  onSubmit: (messageText?: string) => void;
  query: string;
  setQuery: (query: string) => void;
  initialPage?: boolean;
  onStop?: UseChatHelpers<UIMessage>['stop'];
}

const ChatInput: React.FC<ChatInputProps> = ({ isSubmitting, onSubmit, initialPage, query, setQuery, onStop }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isMobile = useIsMobile();
  const { clearTransition } = useChatTransition();
  const hasValue = !!query.trim();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const { mutate: createTranscript, isPending: isCreatingTranscript } = useCreateTranscript();

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleInputChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    setQuery(value);
    adjustHeight();
  };

  const handleSubmit = async () => {
    const value = query.trim();
    if (!value) return;

    if (initialPage) {
      onSubmit(value);
      return;
    }
    clearTransition();
    onSubmit(value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [query]);

  useEffect(() => {
    if (!isSubmitting && !isMobile && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isSubmitting, isMobile]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      audioChunksRef.current = [];
      setIsRecording(false);
      setMediaStream(null);
    }
  };

  const completeRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

        createTranscript(audioFile, {
          onSuccess: (data) => {
            setQuery(data);
            audioChunksRef.current = [];
            setMediaStream(null);
            resolve();
          },
          onError: () => {
            toast.error('Error transcribing audio. Please try again.');
            audioChunksRef.current = [];
            setMediaStream(null);
            resolve();
          },
        });
      };

      mediaRecorder.stop();
    });
  };

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-2'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className={cn('relative flex w-full flex-col gap-2 overflow-hidden rounded-xl', isSubmitting && 'opacity-90')}
      >
        <div className='bg-card/80 border-input relative flex flex-col overflow-hidden rounded-xl border'>
          {isRecording || isCreatingTranscript ? (
            <div className='flex w-full items-center gap-4 p-2'>
              <LiveWaveform
                active={isRecording}
                processing={isCreatingTranscript}
                barWidth={3}
                barGap={2}
                barRadius={4}
                height={50}
                sensitivity={2}
                fadeEdges={true}
                barColor='gray'
                mode='scrolling'
                historySize={10000}
                className='flex-1'
              />
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='rounded-full'
                  onClick={cancelRecording}
                  disabled={isCreatingTranscript}
                >
                  <X className='h-4 w-4' />
                </Button>
                <Button
                  type='button'
                  size='icon'
                  className='rounded-full'
                  onClick={completeRecording}
                  disabled={isCreatingTranscript}
                >
                  {isCreatingTranscript ? (
                    <Loader className='h-4 w-4 animate-spin' />
                  ) : (
                    <>
                      <Check className='h-4 w-4' />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                disabled={isSubmitting}
                value={query}
                rows={1}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="What's on your mind today?"
                className={cn(
                  'placeholder:text-muted-foreground/60 h-auto max-h-[200px] w-full resize-none bg-transparent p-4 pr-24 outline-none focus:ring-0',
                  isSubmitting && 'cursor-not-allowed',
                )}
              />
              <div className='absolute right-0 bottom-0 flex justify-end gap-2 p-2'>
                <Button
                  type='button'
                  variant={'secondary'}
                  size='icon'
                  className='rounded-full shadow-none'
                  onClick={startRecording}
                  disabled={isSubmitting || isCreatingTranscript}
                >
                  <Mic className='h-4 w-4' />
                </Button>
                {isSubmitting && onStop ? (
                  <Button type='button' className='rounded-xl' size='sm' onClick={onStop}>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Stop
                  </Button>
                ) : (
                  <Button type='submit' className='rounded-full' size='icon' disabled={isSubmitting || !hasValue}>
                    {isSubmitting ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
