'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FolderOpen, AlertCircle, CalendarDays, FileSignature, DollarSign, AlertTriangle, Users, BarChart2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { RecentCasesTable } from '@/components/dashboard/recent-cases-table';
import { StaffDashboard } from '@/components/dashboard/staff-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardStats } from '@/lib/api/dashboard';
import { getRevenueReport } from '@/lib/api/revenue';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';

function formatCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function MonthlyBarChart({ data }: { data: { month: string; count: number; revenue: number }[] }) {
  const dataMap = new Map(data.map((d) => [d.month, d]));
  const slots = getLast12Months().map((month) => {
    const entry = dataMap.get(month) ?? { month, count: 0, revenue: 0 };
    const [, mm] = month.split('-');
    return { ...entry, label: MONTH_LABELS[parseInt(mm, 10) - 1]! };
  });

  return (
    <ResponsiveContainer width="100%" height={148}>
      <BarChart data={slots} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="28%">
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(220 10% 45%)' }}
        />
        <Tooltip
          cursor={{ fill: 'hsl(35 15% 92%)', radius: 4 }}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid hsl(35 20% 86%)',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          formatter={(value, name) => {
            const n = Number(value);
            return name === 'count' ? [n, 'Cases'] : [formatCurrency(n), 'Revenue'];
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {slots.map((entry, idx) => (
            <Cell
              key={idx}
              fill={entry.count > 0 ? 'hsl(220 25% 18%)' : 'hsl(35 15% 88%)'}
              fillOpacity={entry.count > 0 ? 0.82 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

type StaffWorkload = { id: string; name: string; email: string; role: string; activeCases: number; overdueTaskCount: number };

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'staff' ? (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />
      <StaffDashboard />
    </div>
  ) : (
    <DirectorDashboard />
  );
}

function DirectorDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const now = new Date();
  const ytdFrom = new Date(now.getFullYear(), 0, 1).toISOString();
  const chartFrom = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1).toISOString();
  const to = now.toISOString();

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-report', ytdFrom],
    queryFn: () => getRevenueReport(ytdFrom, to),
  });

  const { data: chartRevenue, isLoading: chartLoading } = useQuery({
    queryKey: ['revenue-chart', chartFrom],
    queryFn: () => getRevenueReport(chartFrom, to),
  });

  const { data: workload, isLoading: workloadLoading } = useQuery<StaffWorkload[]>({
    queryKey: ['staff-workload'],
    queryFn: () => apiClient.get('/analytics/staff-workload').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      {/* Row 1: 4 operational stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Cases"
          value={stats?.activeCases}
          icon={FolderOpen}
          description="New + in progress"
          loading={isLoading}
          href="/cases?filter=active"
          delta={stats?.activeCasesDelta}
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueTasks}
          icon={AlertCircle}
          description="Past due date"
          loading={isLoading}
          href="/cases?filter=overdue"
        />
        <StatCard
          title="Cases This Month"
          value={stats?.casesThisMonth}
          icon={CalendarDays}
          description="Created in current month"
          loading={isLoading}
          href="/cases?filter=this-month"
          delta={stats?.casesLastMonthDelta}
        />
        <StatCard
          title="Pending Signatures"
          value={stats?.pendingSignatures}
          icon={FileSignature}
          description="Awaiting family signature"
          loading={isLoading}
          href="/cases?filter=pending-signatures"
        />
      </div>

      {/* Row 2: 2 revenue stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {revenueLoading ? (
          <>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue (YTD)"
              value={revenue?.totalRevenue}
              icon={DollarSign}
              format="currency"
              description={
                revenue
                  ? `Avg ${formatCurrency(revenue.averageCaseValue)}/case`
                  : undefined
              }
              loading={false}
            />
            {/* Pending balance card — amber tint via wrapper */}
            <Card>
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Pending Balance</p>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-3xl font-semibold text-amber-600">
                  {revenue ? formatCurrency(revenue.pendingBalance) : '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Outstanding across all cases</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Row 3: Monthly bar chart + revenue by service type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cases by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <MonthlyBarChart data={chartRevenue?.casesByMonth ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Service Type</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : revenue && revenue.revenueByServiceType.length > 0 ? (() => {
                const maxRev = Math.max(...revenue.revenueByServiceType.map((r) => r.revenue), 1);
                return (
                  <div className="space-y-3">
                    {revenue.revenueByServiceType.map((row) => (
                      <div key={row.serviceType} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize font-medium">{row.serviceType}</span>
                          <div className="flex items-center gap-3 text-right">
                            <span className="text-muted-foreground tabular-nums text-xs">{row.count} case{row.count !== 1 ? 's' : ''}</span>
                            <span className="font-medium tabular-nums w-20 text-right">{formatCurrency(row.revenue)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/70 rounded-full transition-all duration-500"
                              style={{ width: `${(row.revenue / maxRev) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">
                            {row.count > 0 ? `${formatCurrency(row.revenue / row.count)} avg` : '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })() : (
              <div className="py-8 flex flex-col items-center gap-2 text-center">
                <BarChart2 className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No revenue data yet.</p>
                <p className="text-xs text-muted-foreground/60">Data will appear once cases have payments recorded.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff workload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Workload
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workloadLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : workload && workload.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Staff Member</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Active Cases</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Overdue Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {workload.map((member) => (
                    <tr key={member.id}>
                      <td className="py-2">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </td>
                      <td className="py-2 text-right tabular-nums">{member.activeCases}</td>
                      <td className="py-2 text-right tabular-nums">
                        {member.overdueTaskCount > 0 ? (
                          <span className="text-destructive font-medium">{member.overdueTaskCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center gap-2 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No staff members found.</p>
              <p className="text-xs text-muted-foreground/60">Invite staff from Settings to see workload here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent cases table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Cases</h2>
        <RecentCasesTable />
      </div>
    </div>
  );
}
