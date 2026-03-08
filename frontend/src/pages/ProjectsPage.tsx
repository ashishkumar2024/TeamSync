import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useOrg } from '../hooks/useOrg';

export function ProjectsPage() {
  const { org, setOrg } = useOrg();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
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

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', currentOrgId],
    queryFn: async () => {
      const { data } = await api.get(`/projects?organizationId=${currentOrgId}`);
      return data;
    },
    enabled: !!currentOrgId,
  });

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post('/memberships/invite', {
        organizationId: currentOrgId,
        email,
        role: 'MEMBER',
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships', currentOrgId] });
      setInviteEmail('');
      setShowInvite(false);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await api.post('/projects', {
        organizationId: currentOrgId,
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', currentOrgId] });
      setName('');
      setDescription('');
      setShowForm(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, description: description || undefined });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Projects</h1>
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
          <button
            type="button"
            onClick={() => setShowInvite(!showInvite)}
            className="px-3 py-1.5 rounded-md border border-slate-300 text-sm hover:bg-slate-50"
          >
            Invite
          </button>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800"
          >
            New project
          </button>
        </div>
      </div>
      {showInvite && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate(inviteEmail);
          }}
          className="mb-4 p-4 bg-white rounded-lg shadow space-y-2"
        >
          <input
            type="email"
            placeholder="Email to invite"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="block w-full rounded-md border-slate-300 text-sm"
            required
          />
          <button type="submit" className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm">
            Send invite
          </button>
        </form>
      )}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-white rounded-lg shadow space-y-2">
          <input
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <button type="submit" className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm">
            Create
          </button>
        </form>
      )}
      {!currentOrgId && orgs?.length === 0 && (
        <p className="text-slate-600 text-sm">Create an organization first.</p>
      )}
      {isLoading && <p className="text-slate-500 text-sm">Loading…</p>}
      {projects && (
        <ul className="space-y-2">
          {projects.map((p: { id: string; name: string; description?: string }) => (
            <li key={p.id} className="bg-white rounded-lg shadow p-4">
              <div className="font-medium">{p.name}</div>
              {p.description && <div className="text-sm text-slate-500">{p.description}</div>}
            </li>
          ))}
          {projects.length === 0 && (
            <li className="text-slate-500 text-sm">No projects yet.</li>
          )}
        </ul>
      )}
    </div>
  );
}
