'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FeedbackAttachmentInput } from './feedback-attachment-input';
import { submitFeedback, type FeedbackCategory } from '@/lib/api/feedback';
import { useCurrentUser } from '@/hooks/use-current-user';

const feedbackSchema = z.object({
  category: z.enum(['bug', 'feature_request', 'general']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  submitterName: z.string().max(150).optional(),
  submitterEmail: z.string().email('Invalid email').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof feedbackSchema>;

interface Props {
  onSuccess: () => void;
  compact?: boolean;
}

export function FeedbackForm({ onSuccess, compact = false }: Props) {
  const { user } = useCurrentUser();
  const [attachmentKeys, setAttachmentKeys] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(feedbackSchema),
    defaultValues: {
      category: 'general',
      message: '',
      submitterName: user?.name ?? '',
      submitterEmail: user?.email ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await submitFeedback({
        category: values.category as FeedbackCategory,
        message: values.message,
        submitterName: values.submitterName || undefined,
        submitterEmail: values.submitterEmail || undefined,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        attachmentKeys: attachmentKeys.length > 0 ? attachmentKeys : undefined,
      });
      toast.success('Feedback submitted — thank you!');
      form.reset();
      setAttachmentKeys([]);
      onSuccess();
    } catch {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bug">Bug report</SelectItem>
                  <SelectItem value="feature_request">Feature request</SelectItem>
                  <SelectItem value="general">General feedback</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the issue or share your thoughts..."
                  rows={compact ? 4 : 6}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!compact && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="submitterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="submitterEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium leading-none">Attachments (optional)</p>
          <FeedbackAttachmentInput onChange={setAttachmentKeys} />
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? 'Submitting...' : 'Submit feedback'}
        </Button>
      </form>
    </Form>
  );
}
