import { LogIn, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import FamilySetup from './pages/FamilySetup';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setProfile(data);
      }
    } catch (err) {
      console.error('Auth check failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email) return;
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setProfile(data);
      } else {
        // Simple registration for demo/family purposes if not found
        // In a real app, you'd have a separate registration flow
        alert("Utilisateur non trouvé. Veuillez d'abord configurer votre famille.");
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-4xl text-white shadow-xl">
          K
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900">Bienvenue sur Kidos</h1>
        <p className="mb-8 max-w-sm text-lg text-slate-600">
          Gérez les tâches de la famille et récompensez vos enfants localement sur votre Raspberry Pi.
        </p>
        
        <div className="w-full max-w-xs space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            className="w-full rounded-xl border-slate-200 bg-white px-4 py-3 focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
          >
            <LogIn className="h-5 w-5" />
            Accéder à mon espace
          </button>
          
          <button 
            onClick={() => setUser({ temp: true })} // Trigger setup flow
            className="text-sm font-medium text-slate-500 hover:text-blue-600"
          >
            Première fois ? Créer un espace familial
          </button>
        </div>
      </div>
    );
  }

  // If temp user, show setup
  if (user.temp || !profile) {
    return <FamilySetup onProfileCreated={(p) => { setUser(p); setProfile(p); }} />;
  }

  return <Dashboard profile={profile} onLogout={handleLogout} />;
}
