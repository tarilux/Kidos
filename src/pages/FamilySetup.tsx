import { useState } from 'react';
import { cn } from '../lib/utils';
import { Users, UserPlus, ArrowRight } from 'lucide-react';

interface Props {
  onProfileCreated: (profile: any) => void;
}

export default function FamilySetup({ onProfileCreated }: Props) {
  const [step, setStep] = useState<'choice' | 'create' | 'join'>('choice');
  const [familyName, setFamilyName] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [role, setRole] = useState<'parent' | 'kid'>('parent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateFamily = async () => {
    if (!familyName || !userName || !userEmail) return;
    setLoading(true);
    setError('');
    try {
      // 1. Create Family
      const familyRes = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: familyName, adminId: 'temporary' }),
      });
      const family = await familyRes.json();

      // 2. Create User Profile
      const userRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          role: 'parent',
          familyId: family.id,
          avatar: ''
        }),
      });
      
      if (!userRes.ok) throw new Error('Could not create profile');
      const profile = await userRes.json();
      
      onProfileCreated(profile);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la création de la famille.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode || !userName || !userEmail) return;
    setLoading(true);
    setError('');
    try {
      // 1. Find Family
      const familyRes = await fetch(`/api/families/${inviteCode}`);
      if (!familyRes.ok) {
        setError('Code d\'invitation invalide.');
        return;
      }
      const family = await familyRes.json();

      // 2. Create User Profile
      const userRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          role,
          familyId: family.id,
          avatar: ''
        }),
      });

      if (!userRes.ok) throw new Error('Email déjà utilisé ou erreur profil');
      const profile = await userRes.json();
      
      onProfileCreated(profile);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'adhésion à la famille.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configuration</h2>
          <p className="mt-2 text-slate-600">Commençons par configurer votre espace familial.</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {step === 'choice' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('create')}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-100 p-6 text-left transition-all hover:border-blue-600 hover:bg-blue-50 group"
            >
              <div>
                <h3 className="font-bold text-slate-900">Créer une famille</h3>
                <p className="text-sm text-slate-500">Devenez l'administrateur de votre maison.</p>
              </div>
              <UserPlus className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />
            </button>

            <button
              onClick={() => setStep('join')}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-100 p-6 text-left transition-all hover:border-emerald-600 hover:bg-emerald-50 group"
            >
              <div>
                <h3 className="font-bold text-slate-900">Rejoindre une famille</h3>
                <p className="text-sm text-slate-500">Utilisez un code partagé par un parent.</p>
              </div>
              <Users className="h-6 w-6 text-slate-400 group-hover:text-emerald-600" />
            </button>
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nom de la famille</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Ex: Famille Martin"
                className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-600 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Votre nom</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Thomas"
                className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-600 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Votre email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-600 focus:ring-blue-600"
              />
            </div>
            <button
              onClick={handleCreateFamily}
              disabled={loading || !familyName || !userName || !userEmail}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer ma famille'}
              <ArrowRight className="h-5 w-5" />
            </button>
            <button onClick={() => setStep('choice')} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700">
              Retour
            </button>
          </div>
        )}

        {step === 'join' && (step === 'join') && (
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Code d'invitation</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="EX: ABC123"
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:border-emerald-600 focus:ring-emerald-600 uppercase"
                />
              </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Votre nom</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Julie"
                className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:border-emerald-600 focus:ring-emerald-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Votre email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:border-emerald-600 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Votre rôle</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setRole('parent')}
                    className={cn(
                      "rounded-xl border-2 py-3 text-sm font-bold transition-all",
                      role === 'parent' ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-100 text-slate-600"
                    )}
                  >
                    Parent
                  </button>
                  <button
                    onClick={() => setRole('kid')}
                    className={cn(
                      "rounded-xl border-2 py-3 text-sm font-bold transition-all",
                      role === 'kid' ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-100 text-slate-600"
                    )}
                  >
                    Enfant
                  </button>
                </div>
              </div>

            <button
              onClick={handleJoinFamily}
              disabled={loading || !inviteCode || !userName || !userEmail}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Rejoindre'}
              <ArrowRight className="h-5 w-5" />
            </button>
            <button onClick={() => setStep('choice')} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700">
              Retour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
