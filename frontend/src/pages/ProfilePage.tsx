import { useAuth } from '../hooks/useAuth';

export function ProfilePage() {
  const { user, setAuth } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Profile</h1>
      {user && (
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Name:</span> {user.name}
          </div>
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
        </div>
      )}
      <button
        type="button"
        className="mt-4 inline-flex items-center px-3 py-1.5 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
        onClick={() => setAuth(null, null)}
      >
        Sign out
      </button>
    </div>
  );
}

