'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Key, Save, Trash2, UserPlus, Zap, Crown, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  getUsersAction, 
  createJournalistAction, 
  deleteUserAction, 
  getApiVaultAction, 
  updateApiVaultAction,
  toggleUserRoleAction} from '@/app/actions/admin';

export default function DirectorPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'vault'>('users');
  const [loading, setLoading] = useState(true);
  
  // State para Usuarios
  const [usersList, setUsersList] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', image: '', role: 'analyst' });
  const [isCreating, setIsCreating] = useState(false);

  const analysts = usersList.filter(u => u.role === 'analyst');
  const admins = usersList.filter(u => u.role === 'admin');
  
  const analystLimitReached = analysts.length >= 8;
  const adminLimitReached = admins.length >= 4;
  const currentLimitReached = newUser.role === 'analyst' ? analystLimitReached : adminLimitReached;

  // State para API Vault
  const [vault, setVault] = useState({
    key1: '',
    key2: '',
    key3: '',
    key4: ''
  });
  const [isSavingVault, setIsSavingVault] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const u = await getUsersAction();
      const v = await getApiVaultAction();
      setUsersList(u);
      setVault({
        key1: v.key1 || '',
        key2: v.key2 || '',
        key3: v.key3 || '',
        key4: v.key4 || ''
      });
    } catch (error) {
      toast.error("Error de acceso", { description: "Solo el Director tiene acceso a esta unidad." });
    } finally {
      setLoading(false);
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;

    const confirmPass = prompt(`🛡️ AUTORIZACIÓN DE RECLUTAMIENTO\n\nVas a crear una cuenta para ${newUser.name.toUpperCase()}.\nIngresa TU CONTRASEÑA de Director para autorizar:`);
    if (!confirmPass) return;

    setIsCreating(true);
    try {
      await createJournalistAction(newUser.name, newUser.email, newUser.password, newUser.role, confirmPass, newUser.image);
      toast.success("Miembro Reclutado", { description: `El acceso como ${newUser.role} ha sido habilitado.` });
      setNewUser({ name: '', email: '', password: '', image: '', role: 'analyst' });
      loadData();
    } catch (err: any) {
      toast.error("Fallo de Autorización", { description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    const confirmPass = prompt(`🛡️ SEGURIDAD DE COMANDO\n\nEstás a punto de dar de baja a ${name.toUpperCase()}.\nPor favor, ingresa TU CONTRASEÑA de Director para confirmar:`);
    
    if (!confirmPass) return;

    try {
      await deleteUserAction(id, confirmPass);
      toast.success("Credenciales Revocadas", { description: `${name} ha sido eliminado de la red.` });
      loadData();
    } catch (err: any) {
      toast.error("Fallo de Seguridad", { description: err.message });
    }
  };

  const handleToggleRole = async (user: any) => {
    const isPromoting = user.role === 'analyst';
    const actionName = isPromoting ? "ASCENDER A DIRECTOR" : "DEGRADAR A ANALISTA";
    
    const confirmPass = prompt(`🛡️ CAMBIO DE RANGO\n\nVas a ${actionName} a ${user.name.toUpperCase()}.\nIngresa TU CONTRASEÑA para confirmar el cambio de jerarquía:`);
    
    if (!confirmPass) return;

    try {
      await toggleUserRoleAction(user.id, confirmPass);
      toast.success("Rango Actualizado", { description: `${user.name} ahora es ${isPromoting ? 'Director' : 'Analista'}.` });
      loadData();
    } catch (err: any) {
      toast.error("Error de Jerarquía", { description: err.message });
    }
  };

  const handleSaveVault = async () => {
    setIsSavingVault(true);
    try {
      await updateApiVaultAction(vault);
      toast.success("Bóveda Sincronizada", { description: "La rotación de IA ahora usará las nuevas llaves." });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingVault(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="text-primary animate-spin" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Accediendo a la Consola del Director...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER DE LA CONSOLA */}
      <div className="relative overflow-hidden bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Shield size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(202,251,72,0.3)]">
              <Crown size={32} className="text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Consola del Director</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-primary uppercase tracking-[0.3em]">Nivel de Acceso: 01 (Master)</span>
                <div className="w-1 h-1 rounded-full bg-primary/40" />
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">RR-ONDA Central Command</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
             <button 
               onClick={() => setActiveTab('users')}
               className={cn(
                 "flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                 activeTab === 'users' ? "bg-white/10 text-white shadow-xl" : "text-white/30 hover:text-white/60 hover:bg-white/5"
               )}
             >
               <Users size={16} />
               Personal
             </button>
             <button 
               onClick={() => setActiveTab('vault')}
               className={cn(
                 "flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                 activeTab === 'vault' ? "bg-primary text-black shadow-[0_0_20px_rgba(202,251,72,0.3)]" : "text-white/30 hover:text-white/60 hover:bg-white/5"
               )}
             >
               <Key size={16} />
               Bóveda de IA
             </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* FORMULARIO DE RECLUTAMIENTO */}
            <div className="lg:col-span-1">
               <div className="bg-surface border border-white/5 rounded-3xl p-8 sticky top-24">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <UserPlus className="text-primary" size={20} />
                      <h2 className="text-sm font-black text-white uppercase tracking-widest">Reclutamiento</h2>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded",
                        analystLimitReached ? "bg-red-500/20 text-red-500" : "bg-primary/20 text-primary"
                      )}>
                        Analistas: {analysts.length}/8
                      </div>
                      <div className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded",
                        adminLimitReached ? "bg-red-500/20 text-red-500" : "bg-purple-500/20 text-purple-400"
                      )}>
                        Directores: {admins.length}/4
                      </div>
                    </div>
                  </div>

                  {currentLimitReached ? (
                    <div className="space-y-4">
                       <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                          <AlertTriangle className="text-red-500 mb-2" size={24} />
                          <p className="text-xs text-red-500 font-bold uppercase leading-relaxed">
                            Límite Alcanzado
                          </p>
                          <p className="text-[10px] text-white/40 mt-1 uppercase leading-relaxed tracking-wider">
                            La red de Onda está limitada a 8 analistas y 4 directores por seguridad. Elimina un miembro para habilitar espacio.
                          </p>
                       </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateUser} className="space-y-6">
                      <div className="space-y-4">
                        {/* Role Selection */}
                        <div className="flex gap-2 p-1 bg-black/40 border border-white/10 rounded-xl mb-4">
                          <button 
                            type="button"
                            onClick={() => setNewUser({...newUser, role: 'analyst'})}
                            className={cn(
                              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                              newUser.role === 'analyst' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                            )}
                          >
                            Analista
                          </button>
                          <button 
                            type="button"
                            onClick={() => setNewUser({...newUser, role: 'admin'})}
                            className={cn(
                              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                              newUser.role === 'admin' ? "bg-purple-500 text-white" : "text-white/20 hover:text-white/40"
                            )}
                          >
                            Director
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Nombre Completo</label>
                          <input 
                            type="text" 
                            required
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary transition-all outline-none"
                            placeholder="Ej: Periodista de Investigación"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Correo Electrónico</label>
                          <input 
                            type="email" 
                            required
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary transition-all outline-none"
                            placeholder="periodista@ondaradio.com"
                          />
                        </div>
                        <div className="relative group/field">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Contraseña de Acceso</label>
                            <button 
                              type="button"
                              onClick={() => {
                                const pass = `ONDA-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                                setNewUser({...newUser, password: pass});
                                toast.info("Contraseña Generada", { description: pass });
                              }}
                              className="text-[9px] font-bold text-primary hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest"
                            >
                              <Zap size={10} /> Generar Clave
                            </button>
                          </div>
                          <input 
                            type="text" 
                            required
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary transition-all outline-none"
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">URL de Foto (Avatar)</label>
                          <input 
                            type="text" 
                            value={newUser.image}
                            onChange={e => setNewUser({...newUser, image: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary transition-all outline-none"
                            placeholder="https://images.unsplash.com/..."
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={isCreating}
                        className={cn(
                          "w-full font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2",
                          newUser.role === 'admin' ? "bg-purple-600 text-white shadow-purple-500/20" : "bg-primary text-black shadow-primary/20"
                        )}
                      >
                        {isCreating ? <Loader2 size={16} className="animate-spin" /> : <><Zap size={16} /> Reclutar {newUser.role === 'admin' ? 'Director' : 'Analista'}</>}
                      </button>
                    </form>
                  )}
               </div>
            </div>

            {/* LISTA DE ANALISTAS */}
            <div className="lg:col-span-2">
               <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Nuestra Red de Inteligencia</h2>
                    <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{usersList.length} Miembros activos</span>
                  </div>
                  
                  <div className="divide-y divide-white/5">
                    {usersList.map((user) => (
                      <div key={user.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-center gap-6">
                           <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center border border-white/10 shadow-inner">
                              {user.image ? (
                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl font-black text-white/20">{user.name?.[0].toUpperCase()}</span>
                              )}
                            </div>
                            {user.role === 'admin' && (
                              <div className="absolute -top-2 -right-2 bg-primary p-1 rounded-lg shadow-lg">
                                <Crown size={12} className="text-black" />
                              </div>
                            )}
                           </div>
                           <div>
                             <div className="flex items-center gap-3">
                              <h3 className="text-sm font-bold text-white uppercase tracking-tight">{user.name}</h3>
                              <span className={cn(
                                "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded",
                                user.role === 'admin' ? "bg-primary text-black" : "bg-white/10 text-white/40"
                              )}>
                                {user.role}
                              </span>
                             </div>
                             <p className="text-xs text-white/30 font-medium">{user.email}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-2">
                           {user.email !== "duviduvan22@gmail.com" && (
                             <>
                               <button 
                                 onClick={() => handleToggleRole(user)}
                                 className={cn(
                                   "p-3 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg border border-white/5",
                                   user.role === 'admin' ? "text-purple-400 hover:bg-purple-500 hover:text-white" : "text-primary hover:bg-primary hover:text-black"
                                 )}
                                 title={user.role === 'admin' ? "Degradar a Analista" : "Ascender a Director"}
                               >
                                 <Zap size={18} />
                               </button>
                               <button 
                                 onClick={() => handleDeleteUser(user.id, user.name || "Sin nombre")}
                                 className="p-3 text-white/10 hover:text-white hover:bg-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg border border-white/5"
                                 title="Eliminar de la Red"
                               >
                                 <Trash2 size={18} />
                               </button>
                             </>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="vault-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-[#0f0f0f] border border-white/10 rounded-[40px] p-10 shadow-3xl">
               <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Bóveda de Secretos (IA Vault)</h2>
                    <p className="text-xs text-white/30 mt-1">Configura llaves de emergencia para rotación automática de Gemini.</p>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    {[1, 2, 3, 4].map((num) => (
                      <div key={num} className="relative group">
                         <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 text-[40px] font-black text-white/5 select-none pointer-events-none group-focus-within:text-primary/10 transition-colors">
                           {String(num).padStart(2, '0')}
                         </div>
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-3 block">
                            Llave Gemini 1.5/2.0 Canal {num}
                         </label>
                         <div className="relative">
                            <input 
                              type="password" 
                              value={(vault as any)[`key${num}`]}
                              onChange={(e) => setVault({...vault, [`key${num}`]: e.target.value})}
                              className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-mono focus:border-primary transition-all outline-none focus:ring-1 focus:ring-primary/20"
                              placeholder="AIzaSy..."
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                               {(vault as any)[`key${num}`] ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-yellow-500/30" />}
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 space-y-3">
                     <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                       <Zap size={14} /> Algoritmo de Rotación Activo (Round-Robin)
                     </h3>
                     <p className="text-xs text-white/50 leading-relaxed">
                       El sistema intentará usar la primera llave configurada. Si falla por cuota (429) o error técnico, saltará automáticamente a la siguiente disponible en la bóveda, asegurando un flujo de redacción ininterrumpido.
                     </p>
                  </div>

                  <button 
                    onClick={handleSaveVault}
                    disabled={isSavingVault}
                    className="w-full bg-primary text-black font-black uppercase tracking-[0.4em] text-[11px] py-5 rounded-2xl hover:bg-white transition-all shadow-[0_20px_40px_rgba(202,251,72,0.2)] active:scale-95 flex items-center justify-center gap-3 mt-10"
                  >
                    {isSavingVault ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Sincronizar Bóveda</>}
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
