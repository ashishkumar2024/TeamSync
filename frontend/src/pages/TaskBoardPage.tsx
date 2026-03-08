import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useOrg } from '../hooks/useOrg';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;

export function TaskBoardPage() {
  const navigate = useNavigate();
  const { org, setOrg } = useOrg();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: members } = useQuery({
    queryKey: ['memberships', currentOrgId],
    queryFn: async () => {
      const { data } = await api.get(`/memberships?organizationId=${currentOrgId}`);
      return data;
    },
    enabled: !!currentOrgId,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', currentOrgId, projectId],
    queryFn: async () => {
      const params = new URLSearchParams({ organizationId: currentOrgId! });
      if (projectId) params.set('projectId', projectId);
      const { data } = await api.get(`/tasks?${params}`);
      return data;
    },
    enabled: !!currentOrgId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string; assigneeId?: string }) => {
      const { data } = await api.post('/tasks', {
        organizationId: currentOrgId,
        projectId: projectId || (projects?.[0]?.id),
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', currentOrgId, projectId] });
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setShowForm(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', currentOrgId, projectId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pid = projectId || projects?.[0]?.id;
    if (!pid) return;
    createMutation.mutate({
      title,
      description: description || undefined,
      assigneeId: assigneeId || undefined,
    });
  };

  const byStatus = (status: string) =>
    (tasks ?? []).filter((t: { status: string }) => t.status === status);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Task Board</h1>
        <div className="flex items-center gap-2">
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
          {projects?.length > 0 && (
            <select
              value={projectId ?? ''}
              onChange={(e) => setProjectId(e.target.value || null)}
              className="rounded-md border-slate-300 text-sm"
            >
              <option value="">All projects</option>
              {projects.map((p: { id: string; name: string }) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800"
          >
            New task
          </button>
        </div>
      </div>
      {showForm && projects?.length > 0 && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-white rounded-lg shadow space-y-2">
          <select
            value={projectId ?? projects[0].id}
            onChange={(e) => setProjectId(e.target.value)}
            className="block w-full rounded-md border-slate-300 text-sm"
            required
          >
            {projects.map((p: { id: string; name: string }) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-md border-slate-300 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-md border-slate-300 text-sm"
          />
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="block w-full rounded-md border-slate-300 text-sm"
          >
            <option value="">Unassigned</option>
            {members?.map((m: { user: { id: string; name: string } }) => (
              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
            ))}
          </select>
          <button type="submit" className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm">
            Create
          </button>
        </form>
      )}
      {!currentOrgId && orgs?.length === 0 && (
        <p className="text-slate-600 text-sm">Create an organization first.</p>
      )}
      {isLoading && <p className="text-slate-500 text-sm">Loading…</p>}
      {tasks && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUSES.map((status) => (
            <div key={status} className="bg-slate-100 rounded-lg p-3">
              <h2 className="font-medium text-sm mb-2">{status.replace('_', ' ')}</h2>
              <div className="space-y-2">
                {byStatus(status).map((t: {
                  id: string;
                  title: string;
                  description?: string;
                  assignee?: { name: string };
                }) => (
                  <div
                    key={t.id}
                    className="bg-white rounded p-2 shadow-sm text-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/tasks/${t.id}`)}
                  >
                    <div className="font-medium">{t.title}</div>
                    {t.description && (
                      <div className="text-slate-500 text-xs truncate">{t.description}</div>
                    )}
                    {t.assignee && (
                      <div className="text-xs text-slate-400 mt-1">@{t.assignee.name}</div>
                    )}
                    <div className="flex gap-1 mt-2">
                      {STATUSES.filter((s) => s !== status).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateStatusMutation.mutate({ taskId: t.id, status: s })}
                          className="text-xs px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300"
                        >
                          → {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {byStatus(status).length === 0 && (
                  <div className="text-slate-400 text-xs">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
