import { Plus, CheckCircle2, Trophy, Settings, LogOut, Trash2, UserCircle, Star, Home, ShoppingBag, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  profile: any;
  onLogout: () => void;
}

export default function Dashboard({ profile, onLogout }: Props) {
  const [family, setFamily] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'rewards' | 'admin'>('tasks');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingReward, setIsAddingReward] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState({ title: '', points: 5, assignedTo: 'everyone' });
  const [newReward, setNewReward] = useState({ title: '', cost: 20 });

  const fetchData = async () => {
    if (!profile?.familyId) return;
    try {
      const [f, t, r, u] = await Promise.all([
        fetch(`/api/families/id/${profile.familyId}`).then(res => res.json()),
        fetch(`/api/families/${profile.familyId}/tasks`).then(res => res.json()),
        fetch(`/api/families/${profile.familyId}/rewards`).then(res => res.json()),
        fetch(`/api/families/${profile.familyId}/members`).then(res => res.json())
      ]);
      setFamily(f);
      setTasks(t);
      setRewards(r);
      setUsers(u);
    } catch (err) {
      console.error('Fetch error', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds for local updates (simple substitute for Firebase listeners)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', completedBy: profile.id })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyTask = async (taskId: string) => {
    if (profile.role !== 'parent') return;
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'verified' })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (profile.role !== 'parent') return;
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title) return;
    try {
      await fetch(`/api/families/${profile.familyId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      setIsAddingTask(false);
      setNewTask({ title: '', points: 5, assignedTo: 'everyone' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReward = async () => {
    if (!newReward.title) return;
    try {
      await fetch(`/api/families/${profile.familyId}/rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReward)
      });
      setIsAddingReward(false);
      setNewReward({ title: '', cost: 20 });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRedeemReward = async (rewardId: string, cost: number) => {
    if (profile.role !== 'kid') return;
    if ((profile.points || 0) < cost) {
      alert('Points insuffisants !');
      return;
    }
    try {
      const res = await fetch(`/api/rewards/${rewardId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id })
      });
      if (res.ok) {
        alert('Récompense réclamée ! Parlez-en à vos parents.');
        fetchData();
      } else {
        alert('Erreur lors de la réclamation.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0 lg:pl-64">
      {/* Sidebar (Desktop) */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-200">
            K
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Kidos</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all",
              activeTab === 'tasks' ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Home className="h-5 w-5" />
            Tableau de bord
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all",
              activeTab === 'rewards' ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <ShoppingBag className="h-5 w-5" />
            Boutique
          </button>
          {profile.role === 'parent' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all",
                activeTab === 'admin' ? "bg-purple-50 text-purple-600" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Settings className="h-5 w-5" />
              Famille
            </button>
          )}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-6">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <UserCircle className="h-full w-full p-1 text-slate-400" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-bold text-slate-900">{profile.name}</p>
              <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium text-red-600 transition-all hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Top Bar (Mobile) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md lg:hidden">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {activeTab === 'tasks' ? 'Kidos' : activeTab === 'rewards' ? 'Boutique' : 'Configuration'}
        </h1>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
          {profile.role === 'kid' ? (profile.points || 0) : 'P'}
        </div>
      </header>

      {/* Content */}
      <main className="p-4 lg:p-10">
        {activeTab === 'tasks' && (
          <div className="space-y-8">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-3xl bg-blue-600 p-6 text-white shadow-xl shadow-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Points accumulés</p>
                    <p className="text-4xl font-bold">{users.find(u => u.id === profile.id)?.points ?? 0}</p>
                  </div>
                  <Trophy className="h-12 w-12 text-blue-300" />
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500">Tâches à faire</p>
                    <p className="text-4xl font-bold text-slate-900">
                      {tasks.filter(t => t.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-12 w-12 text-slate-200" />
                </div>
              </div>
              
              {profile.role === 'parent' && (
                <div className="rounded-3xl bg-emerald-600 p-6 text-white shadow-xl shadow-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100">Tâches à vérifier</p>
                      <p className="text-4xl font-bold">{tasks.filter(t => t.status === 'completed').length}</p>
                    </div>
                    <CheckCircle2 className="h-12 w-12 text-emerald-300" />
                  </div>
                </div>
              )}
            </div>

            {/* Task List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Tâches quotidiennes</h2>
                {profile.role === 'parent' && (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="flex items-center gap-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <AnimatePresence>
                  {tasks.sort((a, b) => b.status === 'pending' ? 1 : -1).map((task) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={task.id}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all ring-1",
                        task.status === 'verified' ? "ring-slate-100 grayscale opacity-60" : "ring-slate-200 hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900">{task.title}</h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span>{task.points} pts</span>
                            <span>•</span>
                            <span className="capitalize">{task.assignedTo === 'everyone' ? 'Tous' : 'Assigné'}</span>
                          </div>
                        </div>

                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="rounded-full bg-slate-100 p-2 text-slate-400 transition-all hover:bg-emerald-100 hover:text-emerald-600"
                          >
                            <CheckCircle2 className="h-6 w-6" />
                          </button>
                        )}

                        {task.status === 'completed' && profile.role === 'parent' && (
                          <button
                            onClick={() => handleVerifyTask(task.id)}
                            className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700"
                          >
                            Vérifier
                          </button>
                        )}

                        {task.status === 'completed' && profile.role === 'kid' && (
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            En attente...
                          </span>
                        )}

                        {task.status === 'verified' && (
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        )}
                      </div>

                      {profile.role === 'parent' && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="absolute bottom-2 right-2 p-2 text-slate-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {tasks.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400">
                    <CheckCircle2 className="mx-auto mb-2 h-12 w-12 opacity-20" />
                    <p>Aucune tâche pour le moment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Boutique de récompenses</h2>
              {profile.role === 'parent' && (
                <button
                  onClick={() => setIsAddingReward(true)}
                  className="flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                    {reward.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{reward.title}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-emerald-600">{reward.cost} pts</span>
                    {profile.role === 'kid' && (
                      <button
                        onClick={() => handleRedeemReward(reward.id, reward.cost)}
                        disabled={(users.find(u => u.id === profile.id)?.points || 0) < reward.cost}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-30"
                      >
                        Acheter
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {rewards.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <ShoppingBag className="mx-auto mb-2 h-12 w-12 opacity-20" />
                  <p>Aucune récompense configurée.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'admin' && profile.role === 'parent' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Gestion de la famille</h2>
            
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-4 font-bold text-slate-900">Partager l'accès</h3>
              <p className="mb-6 text-slate-600">Donnez ce code aux membres de votre famille pour qu'ils rejoignent votre espace.</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 rounded-xl bg-slate-50 px-6 py-4 text-center text-2xl font-black tracking-widest text-blue-600">
                  {family?.inviteCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(family?.inviteCode);
                    alert('Code copié !');
                  }}
                  className="rounded-xl bg-slate-100 p-4 font-bold text-slate-600 hover:bg-slate-200"
                >
                  Copier
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Membres</h3>
              <div className="grid gap-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                      ) : (
                        <UserCircle className="h-full w-full p-2 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{u.role}</p>
                    </div>
                    {u.role === 'kid' && (
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{u.points || 0}</p>
                        <p className="text-[10px] text-slate-400">POINTS</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 z-40 grid w-full grid-cols-3 border-t border-slate-200 bg-white pb-6 pt-2 lg:hidden">
        <button
          onClick={() => setActiveTab('tasks')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'tasks' ? "text-blue-600" : "text-slate-400")}
        >
          <Home className="h-6 w-6" />
          <span className="text-[10px] font-bold">Accueil</span>
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'rewards' ? "text-emerald-600" : "text-slate-400")}
        >
          <ShoppingBag className="h-6 w-6" />
          <span className="text-[10px] font-bold">Boutique</span>
        </button>
        {profile.role === 'parent' ? (
          <button
            onClick={() => setActiveTab('admin')}
            className={cn("flex flex-col items-center gap-1", activeTab === 'admin' ? "text-purple-600" : "text-slate-400")}
          >
            <Settings className="h-6 w-6" />
            <span className="text-[10px] font-bold">Famille</span>
          </button>
        ) : (
           <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1 text-red-400"
          >
            <LogOut className="h-6 w-6" />
            <span className="text-[10px] font-bold">Quitter</span>
          </button>
        )}
      </nav>

      {/* Modals */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold">Nouvelle tâche</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Titre</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Ex: Ranger sa chambre"
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Points</label>
                <input
                  type="number"
                  value={newTask.points}
                  onChange={(e) => setNewTask({ ...newTask, points: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setIsAddingTask(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600">
                Annuler
              </button>
              <button onClick={handleAddTask} className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-200">
                Ajouter
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isAddingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold">Nouvelle récompense</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Titre</label>
                <input
                  type="text"
                  value={newReward.title}
                  onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                  placeholder="Ex: 1h de console"
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Coût (pts)</label>
                <input
                  type="number"
                  value={newReward.cost}
                  onChange={(e) => setNewReward({ ...newReward, cost: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setIsAddingReward(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600">
                Annuler
              </button>
              <button onClick={handleAddReward} className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-200">
                Ajouter
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
