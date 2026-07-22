'use client';

import { useState } from 'react';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink, Mail, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/use-current-user';
import { apiClient } from '@/lib/api/client';

export default function IntakeSettingsPage() {
  const { user } = useCurrentUser();
  const tenantSlug = user?.tenantSlug ?? '';

  const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'kelovaapp.com';
  const intakeUrl = tenantSlug
    ? `https://${tenantSlug}.${APP_DOMAIN}/intake`
    : '';

  const [copied, setCopied] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sending, setSending] = useState(false);

  async function handleCopy() {
    if (!intakeUrl) return;
    await navigator.clipboard.writeText(intakeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendLink() {
    if (!recipientName.trim() || !recipientEmail.trim() || !tenantSlug) return;
    setSending(true);
    try {
      await apiClient.post(`/intake/${tenantSlug}/send-link`, {
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
      });
      toast.success(`Intake link sent to ${recipientEmail}`);
      setRecipientName('');
      setRecipientEmail('');
    } catch {
      toast.error('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const emailValid = recipientEmail.includes('@') && recipientEmail.includes('.');

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Intake Form</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Share this link with families after first contact. They can complete the intake form
          and sign required authorization documents from any device.
        </p>
      </div>

      {/* ── Intake link ───────────────────────────────────────── */}
      <div className="space-y-3">
        <Label className="font-medium">Your Intake Form Link</Label>
        <div className="flex gap-2">
          <Input
            readOnly
            value={intakeUrl}
            className="font-mono text-sm h-11 bg-muted/50"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={handleCopy}
            disabled={!intakeUrl}
            title="Copy link"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            asChild
            disabled={!intakeUrl}
            title="Preview form"
          >
            <a href={intakeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Families can complete intake details and sign authorization documents in one session.
        </p>
      </div>

      {/* ── Send via email ─────────────────────────────────────── */}
      <div className="space-y-4 border rounded-lg p-5">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Send Link via Email</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="font-medium text-sm">Recipient Name</Label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="James Williams"
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label className="font-medium text-sm">Recipient Email</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="james@email.com"
              className="h-10"
            />
          </div>
        </div>

        <Button
          onClick={handleSendLink}
          disabled={!recipientName.trim() || !emailValid || sending || !tenantSlug}
          className="w-full sm:w-auto"
        >
          {sending ? 'Sending...' : 'Send Intake Link'}
        </Button>
      </div>

      {/* ── What families will see ─────────────────────────────── */}
      <div className="bg-muted/40 rounded-lg p-4 space-y-2 border">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Info className="h-4 w-4 text-muted-foreground" />
          What families complete on this form
        </div>
        <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
          <li>Details about the deceased (name, dates, service type, marital status, occupation, faith tradition)</li>
          <li>Primary and optional secondary family contact information</li>
          <li>Authorized representative confirmation</li>
          <li>Service preferences and notes</li>
          <li>Financial responsibility acknowledgment</li>
          <li>Electronic signature on Authorization for Funeral Services</li>
          <li>Electronic signature on Service &amp; Financial Agreement</li>
        </ul>
      </div>
    </div>
  );
}
