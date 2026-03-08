import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      // Fetch all tasks and find the one we need (since there's no single task endpoint)
      const orgsRes = await api.get('/organizations');
      const orgs = orgsRes.data;
      if (!orgs || orgs.length === 0) return null;
      
      for (const org of orgs) {
        const { data } = await api.get(`/tasks?organizationId=${org.id}`);
        const foundTask = data.find((t: { id: string }) => t.id === taskId);
        if (foundTask) return foundTask;
      }
      return null;
    },
    enabled: !!taskId,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/comments?taskId=${taskId}`);
      return data;
    },
    enabled: !!taskId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (payload: { content: string }) => {
      const { data } = await api.post('/comments', {
        taskId,
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setContent('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createCommentMutation.mutate({ content });
  };

  if (taskLoading) return <div className="text-slate-500">Loading task...</div>;
  if (!task) return <div className="text-slate-500">Task not found</div>;

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-slate-600 hover:text-slate-900"
      >
        ← Back
      </button>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold mb-2">{task.title}</h1>
            {task.description && (
              <p className="text-slate-600 mb-4">{task.description}</p>
            )}
          </div>
          <select
            value={task.status}
            onChange={(e) => updateStatusMutation.mutate(e.target.value)}
            className="rounded-md border-slate-300 text-sm"
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>
        <div className="flex gap-4 text-sm text-slate-500">
          <div>
            <span className="font-medium">Status:</span>{' '}
            <span className="px-2 py-1 rounded bg-slate-100">
              {task.status.replace('_', ' ')}
            </span>
          </div>
          {task.assignee && (
            <div>
              <span className="font-medium">Assignee:</span> {task.assignee.name}
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Comments</h2>
        {commentsLoading && <p className="text-slate-500 text-sm">Loading comments...</p>}
        {comments && comments.length === 0 && (
          <p className="text-slate-500 text-sm mb-4">No comments yet.</p>
        )}
        {comments && comments.length > 0 && (
          <ul className="space-y-4 mb-6">
            {comments.map((c: {
              id: string;
              content: string;
              author: { name: string; email: string };
              createdAt: string;
            }) => (
              <li key={c.id} className="border-l-2 border-slate-200 pl-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">{c.author.name}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-700">{c.content}</p>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            placeholder="Add a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="block w-full rounded-md border-slate-300 text-sm"
            rows={3}
            required
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800"
            disabled={createCommentMutation.isPending}
          >
            {createCommentMutation.isPending ? 'Posting...' : 'Post comment'}
          </button>
        </form>
      </div>
    </div>
  );
}
