'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Trash2, Star, StarOff, Pencil } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getContacts, createContact, deleteContact, updateContact } from '@/lib/api/contacts';
import type { IFamilyContact } from '@/types';

interface ContactFormValues {
  name: string;
  relationship: string;
  email: string;
  phone: string;
  isPrimaryContact: boolean;
}

function EditContactDialog({
  contact,
  caseId,
}: {
  contact: IFamilyContact;
  caseId: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<ContactFormValues>({
      defaultValues: {
        name: contact.name,
        relationship: contact.relationship,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        isPrimaryContact: contact.isPrimaryContact,
      },
    });

  const updateMutation = useMutation({
    mutationFn: (values: ContactFormValues) =>
      updateContact(caseId, contact.id, {
        name: values.name,
        relationship: values.relationship,
        email: values.email || undefined,
        phone: values.phone || undefined,
        isPrimaryContact: values.isPrimaryContact,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts', caseId] });
      toast.success('Contact updated.');
      setOpen(false);
    },
    onError: () => toast.error('Failed to update contact.'),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) reset({
        name: contact.name,
        relationship: contact.relationship,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        isPrimaryContact: contact.isPrimaryContact,
      });
    }}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title="Edit contact"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="e-name">Full Name *</Label>
            <Input
              id="e-name"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="e-rel">Relationship *</Label>
            <Input
              id="e-rel"
              {...register('relationship', { required: 'Relationship is required' })}
              aria-invalid={!!errors.relationship}
            />
            {errors.relationship && <p className="text-destructive text-xs">{errors.relationship.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="e-email">Email</Label>
            <Input
              id="e-email"
              type="email"
              placeholder="jane@email.com"
              {...register('email', {
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
              })}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="e-phone">Phone</Label>
            <Input id="e-phone" type="tel" {...register('phone')} />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="e-primary"
              checked={watch('isPrimaryContact')}
              onCheckedChange={(v) => setValue('isPrimaryContact', v)}
            />
            <Label htmlFor="e-primary" className="cursor-pointer">
              Primary contact
              <span className="block text-xs text-muted-foreground font-normal">
                Required to send the family portal link
              </span>
            </Label>
          </div>

          <Button type="submit" disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContactCard({
  contact,
  caseId,
  onDelete,
  onTogglePrimary,
}: {
  contact: IFamilyContact;
  caseId: string;
  onDelete: (id: string) => void;
  onTogglePrimary: (id: string, current: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between px-4 py-3">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{contact.name}</p>
          {contact.isPrimaryContact && (
            <Badge variant="secondary" className="text-xs">Primary</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{contact.relationship}</p>
        {contact.email ? (
          <p className="text-xs text-muted-foreground">{contact.email}</p>
        ) : (
          <p className="text-xs text-amber-600">No email — add one to send the portal link</p>
        )}
        {contact.phone && (
          <p className="text-xs text-muted-foreground">{contact.phone}</p>
        )}
      </div>
      <div className="flex items-center gap-1 ml-4 shrink-0">
        <EditContactDialog contact={contact} caseId={caseId} />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title={contact.isPrimaryContact ? 'Remove primary' : 'Set as primary'}
          onClick={() => onTogglePrimary(contact.id, contact.isPrimaryContact)}
        >
          {contact.isPrimaryContact ? (
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          ) : (
            <StarOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          title="Remove contact"
          onClick={() => onDelete(contact.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CaseContactsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = use(params);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', caseId],
    queryFn: () => getContacts(caseId),
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<ContactFormValues>({
      defaultValues: { isPrimaryContact: false },
    });

  const createMutation = useMutation({
    mutationFn: (values: ContactFormValues) =>
      createContact(caseId, {
        name: values.name,
        relationship: values.relationship,
        email: values.email || undefined,
        phone: values.phone || undefined,
        isPrimaryContact: values.isPrimaryContact,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts', caseId] });
      toast.success('Contact added.');
      setOpen(false);
      reset();
    },
    onError: () => toast.error('Failed to add contact.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (contactId: string) => deleteContact(caseId, contactId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts', caseId] });
      toast.success('Contact removed.');
    },
    onError: () => toast.error('Failed to remove contact.'),
  });

  const togglePrimaryMutation = useMutation({
    mutationFn: ({ contactId, current }: { contactId: string; current: boolean }) =>
      updateContact(caseId, contactId, { isPrimaryContact: !current }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts', caseId] });
    },
    onError: () => toast.error('Failed to update contact.'),
  });

  return (
    <div>
      <CaseWorkspaceTabs caseId={caseId} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Family Contacts</CardTitle>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Family Contact</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((v) => createMutation.mutate(v))}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">Full Name *</Label>
                  <Input
                    id="c-name"
                    placeholder="Jane Smith"
                    {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-rel">Relationship *</Label>
                  <Input
                    id="c-rel"
                    placeholder="Spouse, Son, Daughter…"
                    {...register('relationship', { required: 'Relationship is required' })}
                    aria-invalid={!!errors.relationship}
                  />
                  {errors.relationship && <p className="text-destructive text-xs">{errors.relationship.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-email">Email</Label>
                  <Input
                    id="c-email"
                    type="email"
                    placeholder="jane@email.com"
                    {...register('email', {
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                    })}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-phone">Phone</Label>
                  <Input id="c-phone" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="c-primary"
                    checked={watch('isPrimaryContact')}
                    onCheckedChange={(v) => setValue('isPrimaryContact', v)}
                  />
                  <Label htmlFor="c-primary" className="cursor-pointer">
                    Primary contact
                    <span className="block text-xs text-muted-foreground font-normal">
                      Required to send the family portal link
                    </span>
                  </Label>
                </div>

                <Button type="submit" disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? 'Adding…' : 'Add Contact'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : !contacts || contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No contacts yet. Add a primary contact with an email to send the family portal link.
            </p>
          ) : (
            <div className="divide-y">
              {contacts.map((c) => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  caseId={caseId}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onTogglePrimary={(id, current) =>
                    togglePrimaryMutation.mutate({ contactId: id, current })
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
