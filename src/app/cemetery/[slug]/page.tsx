'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MOCK_PLOTS = [
  { id: '1', section: 'A', row: '1', number: '01', status: 'available' },
  { id: '2', section: 'A', row: '1', number: '02', status: 'occupied' },
  { id: '3', section: 'A', row: '1', number: '03', status: 'available' },
  { id: '4', section: 'B', row: '2', number: '04', status: 'reserved' },
  { id: '5', section: 'B', row: '2', number: '05', status: 'available' },
  { id: '6', section: 'B', row: '2', number: '06', status: 'occupied' },
];

function plotColor(status: string) {
  if (status === 'available') return 'bg-green-100 border-green-300 text-green-800';
  if (status === 'occupied') return 'bg-red-100 border-red-300 text-red-800';
  return 'bg-yellow-100 border-yellow-300 text-yellow-800';
}

export default function CemeteryPublicPage({ params }: { params: { slug: string } }) {
  const [searchName, setSearchName] = useState('');
  const [visitSubmitted, setVisitSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-semibold">Everlasting Gardens Cemetery</h1>
          <p className="text-muted-foreground">{params.slug}</p>
        </div>

        <Tabs defaultValue="browse">
          <TabsList className="w-full">
            <TabsTrigger value="browse" className="flex-1">Browse Plots</TabsTrigger>
            <TabsTrigger value="search" className="flex-1">Search Burials</TabsTrigger>
            <TabsTrigger value="visit" className="flex-1">Schedule Visit</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6 space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-green-400" />Available
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-red-400" />Occupied
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-yellow-400" />Reserved
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {MOCK_PLOTS.map((p) => (
                <div
                  key={p.id}
                  className={`border rounded-md p-3 text-center text-xs font-medium ${plotColor(p.status)}`}
                >
                  <p>{p.section}-{p.row}-{p.number}</p>
                  <p className="capitalize mt-0.5 opacity-75">{p.status}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Contact us to inquire about available plots or to arrange a visit.
            </p>
          </TabsContent>

          <TabsContent value="search" className="mt-6 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                  <Button>Search</Button>
                </div>

                {searchName.length > 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    No burial records found for &quot;{searchName}&quot;
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    Enter a name to search burial records
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visit" className="mt-6">
            {visitSubmitted ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center space-y-2">
                  <h2 className="text-lg font-semibold">Visit Scheduled</h2>
                  <p className="text-muted-foreground text-sm">
                    We will confirm your appointment by email or phone.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Schedule a Visit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Your Name</label>
                    <Input placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="you@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Phone</label>
                    <Input type="tel" placeholder="(555) 000-0000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Preferred Date</label>
                    <Input type="date" />
                  </div>
                  <Button className="w-full" onClick={() => setVisitSubmitted(true)}>
                    Request Appointment
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
