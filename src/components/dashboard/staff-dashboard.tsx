'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CalendarDays, CheckSquare, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from './stat-card';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

type MyTask = {
  id: string;
  title: string;
  dueDate: string | null;
  caseId: string;
  deceasedName: string;
};

type MyCase = {
  id: string;
  deceasedName: string;
  status: string;
  serviceType: string;
  openTaskCount: number;
  overdueTaskCount: number;
};

type UpcomingEvent = {
  id: string;
  title: string;
  eventType: string;
  startTime: string;
  endTime: string;
  location: string | null;
  case: { id: string; deceasedName: string } | null;
};

type MyDashboard = {
  activeCaseCount: number;
  openTaskCount: number;
  overdueTaskCount: number;
  myCases: MyCase[];
  overdueTasks: MyTask[];
  upcomingTasks: MyTask[];
  upcomingEvents: UpcomingEvent[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const SERVICE_LABELS: Record<string, string> = {
  burial: 'Burial',
  cremation: 'Cremation',
  graveside: 'Graveside',
  memorial: 'Memorial',
};

export function StaffDashboard() {
  const { data, isLoading } = useQuery<MyDashboard>({
    queryKey: ['my-dashboard'],
    queryFn: () => apiClient.get('/analytics/my-dashboard').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="My Active Cases"
          value={data?.activeCaseCount}
          icon={FolderOpen}
          description="Assigned to you"
          loading={isLoading}
          href="/cases?filter=active"
        />
        <StatCard
          title="Open Tasks"
          value={data?.openTaskCount}
          icon={CheckSquare}
          description="Across your cases"
          loading={isLoading}
        />
        <StatCard
          title="Overdue Tasks"
          value={data?.overdueTaskCount}
          icon={AlertCircle}
          description="Past due date"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !data?.overdueTasks.length ? (
              <p className="text-sm text-muted-foreground">No overdue tasks. You&apos;re all caught up.</p>
            ) : (
              <div className="divide-y">
                {data.overdueTasks.map((task) => (
                  <div key={task.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{task.title}</p>
                      <Link href={`/cases/${task.caseId}`} className="text-xs text-muted-foreground hover:underline truncate block">
                        {task.deceasedName}
                      </Link>
                    </div>
                    {task.dueDate && (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        {formatDate(task.dueDate)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !data?.upcomingTasks.length ? (
              <p className="text-sm text-muted-foreground">No upcoming tasks.</p>
            ) : (
              <div className="divide-y">
                {data.upcomingTasks.map((task) => (
                  <div key={task.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{task.title}</p>
                      <Link href={`/cases/${task.caseId}`} className="text-xs text-muted-foreground hover:underline truncate block">
                        {task.deceasedName}
                      </Link>
                    </div>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(task.dueDate)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My cases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            My Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !data?.myCases.length ? (
            <p className="text-sm text-muted-foreground">No active cases assigned to you.</p>
          ) : (
            <div className="divide-y">
              {data.myCases.map((c) => (
                <Link key={c.id} href={`/cases/${c.id}`} className="flex items-center justify-between py-3 gap-3 hover:bg-muted/30 -mx-6 px-6 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.deceasedName}</p>
                    <p className="text-xs text-muted-foreground">{SERVICE_LABELS[c.serviceType] ?? c.serviceType}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.overdueTaskCount > 0 && (
                      <Badge variant="destructive" className="text-xs">{c.overdueTaskCount} overdue</Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">{c.openTaskCount} open</Badge>
                    <Badge variant="outline" className="text-xs">{STATUS_LABELS[c.status] ?? c.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming calendar events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            My Schedule — Next 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !data?.upcomingEvents.length ? (
            <p className="text-sm text-muted-foreground">No events scheduled in the next 7 days.</p>
          ) : (
            <div className="divide-y">
              {data.upcomingEvents.map((event) => (
                <div key={event.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.startTime)} · {formatTime(event.startTime)}–{formatTime(event.endTime)}
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                    {event.case && (
                      <Link href={`/cases/${event.case.id}`} className="text-xs text-muted-foreground hover:underline">
                        {event.case.deceasedName}
                      </Link>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 capitalize">
                    {event.eventType.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
