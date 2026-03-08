import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useOrg } from '../hooks/useOrg';

export function NotificationsPage() {
  const { org, setOrg } = useOrg();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [taskFilter, setTaskFilter] = useState<string>('');

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data } = await api.get('/organizations');
      return data;
    },
  });

  const currentOrgId = org?.id ?? orgs?.[0]?.id;
  if (orgs?.[0] && !org) setOrg(orgs[0]);

  const { data: projects } = useQuery({
    queryKey: ['projects', currentOrgId],
    queryFn: async () => {
      const { data } = await api.get(`/projects?organizationId=${currentOrgId}`);
      return data;
    },
    enabled: !!currentOrgId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', currentOrgId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/notifications?organizationId=${currentOrgId}&page=1&pageSize=50`
      );
      return res;
    },
    enabled: !!currentOrgId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: res } = await api.post(`/notifications/${id}/read`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentOrgId] });
    },
  });

  const items = data?.items ?? [];
  const unreadItems = items.filter((n: { read: boolean }) => !n.read);

  // Apply filters
  const filteredItems = items.filter((n: any) => {
    if (typeFilter && n.type !== typeFilter) return false;
    if (projectFilter && n.projectName !== projectFilter) return false;
    if (taskFilter && (!n.taskName || !n.taskName.toLowerCase().includes(taskFilter.toLowerCase()))) return false;
    return true;
  });
  const filteredUnreadItems = filteredItems.filter((n: { read: boolean }) => !n.read);

  const notificationTypes = [...new Set(items.map((n: any) => n.type))];
  const projectNames = [...new Set(items.map((n: any) => n.projectName).filter(Boolean))];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Notifications</h1>
        {orgs?.length > 0 && (
          <select
            value={currentOrgId ?? ''}
            onChange={(e) => {
              const o = orgs.find((x: { id: string }) => x.id === e.target.value);
              setOrg(o ?? null);
            }}
            className="rounded-md border-slate-300 text-sm"
          >
            {orgs.map((o: { id: string; name: string }) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        )}
      </div>
      
      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border-slate-300 text-sm"
        >
          <option value="">All types</option>
          {notificationTypes.map((type: string) => (
            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
          ))}
        </select>
        
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-md border-slate-300 text-sm"
        >
          <option value="">All projects</option>
          {projectNames.map((name: string) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="Filter by task name"
          value={taskFilter}
          onChange={(e) => setTaskFilter(e.target.value)}
          className="rounded-md border-slate-300 text-sm"
        />
      </div>
      {!currentOrgId && orgs?.length === 0 && (
        <p className="text-slate-600 text-sm">Create an organization first.</p>
      )}
      {isLoading && <p className="text-slate-500 text-sm">Loading…</p>}
      {filteredItems.length === 0 && !isLoading && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
          No notifications match the current filters.
        </div>
      )}
      {filteredItems.length > 0 && (
        <div className="space-y-4">
          {filteredUnreadItems.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-700 mb-2">Unread ({filteredUnreadItems.length})</h2>
              <ul className="space-y-2">
                {filteredUnreadItems.map((n: {
                  id: string;
                  title: string;
                  body?: string;
                  type: string;
                  createdAt: string;
                  taskName?: string;
                  projectName?: string;
                }) => (
                  <li
                    key={n.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100"
                    onClick={() => markReadMutation.mutate(n.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{n.title}</div>
                        {n.body && <div className="text-sm text-slate-600 mt-1">{n.body}</div>}
                        {(n.taskName || n.projectName) && (
                          <div className="text-xs text-slate-500 mt-1">
                            {n.taskName && <span>Task: {n.taskName}</span>}
                            {n.taskName && n.projectName && <span> • </span>}
                            {n.projectName && <span>Project: {n.projectName}</span>}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mt-2">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-blue-200 text-blue-800">
                        {n.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {filteredItems.filter((n: { read: boolean }) => n.read).length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-700 mb-2">Read</h2>
              <ul className="space-y-2">
                {filteredItems.filter((n: { read: boolean }) => n.read).map((n: {
                  id: string;
                  title: string;
                  body?: string;
                  type: string;
                  createdAt: string;
                  taskName?: string;
                  projectName?: string;
                }) => (
                  <li key={n.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-slate-700">{n.title}</div>
                        {n.body && <div className="text-sm text-slate-500 mt-1">{n.body}</div>}
                        {(n.taskName || n.projectName) && (
                          <div className="text-xs text-slate-400 mt-1">
                            {n.taskName && <span>Task: {n.taskName}</span>}
                            {n.taskName && n.projectName && <span> • </span>}
                            {n.projectName && <span>Project: {n.projectName}</span>}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mt-2">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600">
                        {n.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
