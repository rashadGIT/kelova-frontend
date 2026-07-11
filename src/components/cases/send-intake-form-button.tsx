'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/dashboard/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { sendIntakeForm } from '@/lib/api/cases';
import { extractErrorMessage } from '@/lib/utils/error-message';

interface SendIntakeFormButtonProps {
  caseId: string;
}

export function SendIntakeFormButton({ caseId }: SendIntakeFormButtonProps) {
  const [open, setOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => sendIntakeForm(caseId),
    onSuccess: (data) => {
      toast.success(`Intake form sent to ${data.email}`);
      setOpen(false);
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, 'Failed to send intake form'));
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Send className="h-4 w-4" />
          Send Intake Form
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Intake Form</DialogTitle>
          <DialogDescription>
            Send the arrangement form link to the primary contact on file. They
            can complete it at home and submit when ready.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted/50 border px-4 py-3 text-sm text-muted-foreground">
          The form will be emailed to the primary contact associated with this
          case. Make sure a primary contact with an email address has been added
          before sending.
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? 'Sending…' : 'Send Form'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
