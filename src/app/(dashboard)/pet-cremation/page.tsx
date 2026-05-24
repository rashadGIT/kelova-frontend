'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPetCases, getVetClinics } from '@/lib/api/pet-cremation';

export default function PetCremationPage() {
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [showClinicForm, setShowClinicForm] = useState(false);

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ['pet-cases'],
    queryFn: getPetCases,
  });

  const { data: clinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ['vet-clinics'],
    queryFn: getVetClinics,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Pet Cremation" />

      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="clinics">Vet Clinics</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCaseForm((v) => !v)}>
              {showCaseForm ? 'Cancel' : 'New Case'}
            </Button>
          </div>

          {showCaseForm && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Case form coming soon. Fill in pet name, species, owner, and service type.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {casesLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pet Name</TableHead>
                      <TableHead>Species</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pickup Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!cases || cases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No pet cases
                        </TableCell>
                      </TableRow>
                    ) : (
                      cases.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.petName}</TableCell>
                          <TableCell>{c.species}</TableCell>
                          <TableCell>{c.owner}</TableCell>
                          <TableCell>{c.serviceType}</TableCell>
                          <TableCell>{c.status}</TableCell>
                          <TableCell>{c.pickupDate}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinics" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowClinicForm((v) => !v)}>
              {showClinicForm ? 'Cancel' : 'Add Clinic'}
            </Button>
          </div>

          {showClinicForm && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Clinic form coming soon. Fill in clinic name, contact, email, and phone.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {clinicsLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clinic Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!clinics || clinics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No clinics added
                        </TableCell>
                      </TableRow>
                    ) : (
                      clinics.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.clinicName}</TableCell>
                          <TableCell>{c.contact}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell>{c.phone}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
