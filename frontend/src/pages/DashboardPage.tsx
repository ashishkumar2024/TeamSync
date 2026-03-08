import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useOrg } from '../hooks/useOrg';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const [orgName, setOrgName] = useState('');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const queryClient = useQueryClient();
  const { org, setOrg } = useOrg();
  const { user } = useAuth();

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data } = await api.get('/organizations');
      return data;
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/organizations', { name });
      return data;
    },
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setOrg(newOrg);
      setOrgName('');
      setShowCreateOrg(false);
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

  const { data: tasks } = useQuery({
    queryKey: ['tasks', currentOrgId],
    queryFn: async () => {
      const { data } = await api.get(`/tasks?organizationId=${currentOrgId}`);
      return data;
    },
    enabled: !!currentOrgId,
  });

  const myTasks = (tasks ?? []).filter((t: { assigneeId: string | null }) => t.assigneeId === user?.id);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      {orgs && orgs.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
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
          <button
            type="button"
            onClick={() => setShowCreateOrg(true)}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            + New org
          </button>
        </div>
      )}
      {(orgs?.length === 0 || showCreateOrg) && (
        <div className="mb-4">
          <p className="text-slate-600 text-sm mb-2">
            {orgs?.length === 0 ? 'Create an organization to get started.' : 'New organization'}
          </p>
          {showCreateOrg ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOrgMutation.mutate(orgName);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="rounded-md border-slate-300 text-sm px-3 py-2"
                required
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-md bg-slate-900 text-white text-sm"
              >
                Create
              </button>
              {orgs?.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setShowCreateOrg(false); setOrgName(''); }}
                  className="px-3 py-2 rounded-md border border-slate-300 text-sm"
                >
                  Cancel
                </button>
              )}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateOrg(true)}
              className="px-3 py-2 rounded-md bg-slate-900 text-white text-sm"
            >
              Create organization
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Organizations</div>
          <div className="text-2xl font-semibold">{orgs?.length ?? 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">Projects</div>
          <div className="text-2xl font-semibold">{projects?.length ?? 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-500">My Tasks</div>
          <div className="text-2xl font-semibold">{myTasks.length}</div>
        </div>
      </div>
      {myTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-medium mb-2">Assigned to you</h2>
          <ul className="space-y-1 text-sm">
            {myTasks.slice(0, 5).map((t: { id: string; title: string; status: string }) => (
              <li key={t.id} className="flex justify-between">
                <span>{t.title}</span>
                <span className="text-slate-500">{t.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
