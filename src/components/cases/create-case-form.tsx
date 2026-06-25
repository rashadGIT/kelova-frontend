'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ServiceType } from '@/types';
import { createCase } from '@/lib/api/cases';

const createCaseSchema = z.object({
  deceasedFirstName: z.string().min(1, 'First name is required'),
  deceasedLastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType),
  directCremation: z.boolean().optional(),
  notes: z.string().optional(),
});

type CreateCaseFormValues = z.infer<typeof createCaseSchema>;

export function CreateCaseForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<CreateCaseFormValues>({
    resolver: standardSchemaResolver(createCaseSchema),
    defaultValues: { serviceType: ServiceType.burial, directCremation: false },
  });

  const directCremation = form.watch('directCremation');

  const mutation = useMutation({
    mutationFn: createCase,
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success('Case created successfully.');
      router.push(`/cases/${newCase.id}`);
    },
    onError: () => {
      toast.error('Failed to create case. Please try again.');
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) =>
          mutation.mutate({
            ...v,
            serviceType: v.directCremation ? ServiceType.cremation : v.serviceType,
          })
        )}
        className="space-y-4 max-w-lg"
      >
        {/* Direct Cremation fast-track toggle */}
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-900">Direct Cremation</p>
            <p className="text-xs text-amber-700">No viewing or service — sets service type to cremation automatically</p>
          </div>
          <FormField
            control={form.control}
            name="directCremation"
            render={({ field }) => (
              <Switch
                checked={field.value ?? false}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked) form.setValue('serviceType', ServiceType.cremation);
                }}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="deceasedFirstName" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">First Name</FormLabel>
              <FormControl><Input placeholder="First name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="deceasedLastName" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">Last Name</FormLabel>
              <FormControl><Input placeholder="Last name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {!directCremation && (
          <FormField control={form.control} name="serviceType" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">Service Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value={ServiceType.burial}>Burial</SelectItem>
                  <SelectItem value={ServiceType.cremation}>Cremation</SelectItem>
                  <SelectItem value={ServiceType.graveside}>Graveside</SelectItem>
                  <SelectItem value={ServiceType.memorial}>Memorial</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-medium">Notes</FormLabel>
            <FormControl><Textarea placeholder="Any additional notes..." rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Case'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/cases')}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
