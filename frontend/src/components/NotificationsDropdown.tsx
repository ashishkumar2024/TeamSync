import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useOrg } from '../hooks/useOrg';

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const { org } = useOrg();
  const queryClient = useQueryClient();

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data } = await api.get('/organizations');
      return data;
    },
  });

  const orgId = org?.id ?? orgs?.[0]?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', orgId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/notifications?organizationId=${orgId}&page=1&pageSize=20`
      );
      return res;
    },
    enabled: !!orgId && open,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: res } = await api.post(`/notifications/${id}/read`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', orgId] });
    },
  });

  const items = data?.items ?? [];
  const unreadCount = items.filter((n: { read: boolean }) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex items-center px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm shadow-sm hover:bg-slate-50"
        onClick={() => setOpen((o) => !o)}
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-lg border border-slate-200 max-h-96 overflow-y-auto z-50">
          {!orgId ? (
            <div className="p-3 text-sm text-slate-500">Select an organization.</div>
          ) : isLoading ? (
            <div className="p-3 text-sm text-slate-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">No notifications yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n: {
                id: string;
                title: string;
                body?: string;
                read: boolean;
                createdAt: string;
              }) => (
                <li
                  key={n.id}
                  className={`p-3 text-sm cursor-pointer hover:bg-slate-50 ${
                    !n.read ? 'bg-slate-50' : ''
                  }`}
                  onClick={() => !n.read && markReadMutation.mutate(n.id)}
                >
                  <div className="font-medium">{n.title}</div>
                  {n.body && <div className="text-slate-500 text-xs mt-0.5">{n.body}</div>}
                  <div className="text-slate-400 text-xs mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
