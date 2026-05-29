'use client';

import LoadingButton from '@/components/general/LoadingButton';
import UpgradeModal from '@/components/meetings/UpgradeModal';
import { ApiError } from '@/lib/api-client';
import { useCreateMeeting } from '@/queries/meetings';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateMeetingInput, scheduleMeetingFormSchema, ScheduleMeetingFormInput } from '@repo/shared-types/schemas';
import { Button } from '@repo/ui/components/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const toLocalDatetimeValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const ScheduleForm = () => {
  const router = useRouter();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { mutate: createMeeting, isPending } = useCreateMeeting();

  const defaultScheduled = new Date();
  defaultScheduled.setMinutes(defaultScheduled.getMinutes() + 30);

  const form = useForm<ScheduleMeetingFormInput>({
    resolver: zodResolver(scheduleMeetingFormSchema),
    defaultValues: {
      title: '',
      meetUrl: '',
      scheduledAt: defaultScheduled.toISOString(),
      estimatedDurationMinutes: 30,
    },
  });

  const onSubmit = (data: ScheduleMeetingFormInput) => {
    const payload: CreateMeetingInput = data;
    createMeeting(payload, {
      onSuccess: (meeting) => {
        toast.success('Meeting scheduled');
        router.push(`/meetings/${meeting.id}`);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === 'INSUFFICIENT_MINUTES') {
          setUpgradeOpen(true);
          return;
        }
        toast.error(error.message);
      },
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder='Product sync' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='meetUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Meet URL</FormLabel>
                <FormControl>
                  <Input placeholder='https://meet.google.com/abc-defg-hij' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='scheduledAt'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start time</FormLabel>
                <FormControl>
                  <Input
                    type='datetime-local'
                    value={toLocalDatetimeValue(new Date(field.value))}
                    onChange={(e) => {
                      const next = e.target.value ? new Date(e.target.value) : new Date();
                      field.onChange(next.toISOString());
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='estimatedDurationMinutes'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min={1}
                    max={480}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex gap-2'>
            <LoadingButton type='submit' isLoading={isPending}>
              Schedule meeting
            </LoadingButton>
            <Button type='button' variant='outline' onClick={() => router.push('/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
};

export default ScheduleForm;
