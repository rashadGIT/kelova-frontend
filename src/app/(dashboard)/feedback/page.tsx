'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FeedbackForm } from '@/components/feedback/feedback-form';
import { CheckCircle } from 'lucide-react';

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Feedback"
        description="Report a bug, request a feature, or share a thought. We read everything."
      />

      {submitted ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <h2 className="text-xl font-semibold">Thanks for the feedback!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll review it shortly.
              </p>
            </div>
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              Submit another
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <FeedbackForm onSuccess={() => setSubmitted(true)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
