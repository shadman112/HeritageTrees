import React, { useState, useEffect, useMemo } from 'react';
import { Person, ViewType } from './types';
import { INITIAL_PEOPLE } from './constants';
import TreeView from './components/TreeView';
import PersonCard from './components/PersonCard';
import ProfileModal from './components/ProfileModal';
import AddPersonModal from './components/AddPersonModal';
import EditPersonModal from './components/EditPersonModal';
import AdminLoginModal from './components/AdminLoginModal';
import DataManagementModal from './components/DataManagementModal';

const App: React.FC = () => {
  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem('heritage_people');
    return saved ? JSON.parse(saved) : INITIAL_PEOPLE;
  });
  
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('heritage_is_admin') === 'true';
  });

  const [view, setView] = useState<ViewType>('tree');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sync status
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [deploymentCountdown, setDeploymentCountdown] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('heritage_people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('heritage_is_admin', isAdmin.toString());
  }, [isAdmin]);

  // Handle Deployment Countdown
  useEffect(() => {
    if (deploymentCountdown === null) return;
    if (deploymentCountdown <= 0) {
      setDeploymentCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setDeploymentCountdown(deploymentCountdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [deploymentCountdown]);

  const filteredPeople = useMemo(() => {
    return people.filter(p => 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [people, searchQuery]);

  const handleAddPerson = (newPerson: Person) => {
    setPeople([...people, newPerson]);
    setIsAddModalOpen(false);
  };

  const handleUpdatePerson = (updated: Person) => {
    setPeople(people.map(p => p.id === updated.id ? updated : p));
    if (selectedPerson?.id === updated.id) {
      setSelectedPerson(updated);
    }
    setEditingPerson(null);
  };

  const handleImportPeople = (newPeople: Person[]) => {
    setPeople(newPeople);
  };

  const handleDeletePerson = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Remove this person from the records?")) return;
    
    setPeople(prev => prev
      .filter(p => p.id !== id)
      .map(p => ({
        ...p,
        fatherId: p.fatherId === id ? undefined : p.fatherId,
        motherId: p.motherId === id ? undefined : p.motherId,
        spouseId: p.spouseId === id ? undefined : p.spouseId,
      }))
    );
    setSelectedPerson(null);
  };

  const handleQuickPublish = async () => {
    const configStr = localStorage.getItem('heritage_gh_config');
    if (!configStr) {
      setIsDataModalOpen(true);
      return;
    }

    const config = JSON.parse(configStr);
    if (!config.token || !config.username || !config.repo) {
      setIsDataModalOpen(true);
      return;
    }

    setSyncStatus('syncing');
    
    try {
      // 1. Get SHA for constants.tsx
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${config.username}/${config.repo}/contents/constants.tsx?ref=${config.branch || 'main'}`,
        {
          headers: {
            Authorization: `token ${config.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!getFileResponse.ok) throw new Error(`constants.tsx not found on branch: ${config.branch || 'main'}`);
      const { sha } = await getFileResponse.json();

      // 2. Prepare content
      const content = `import React from 'react';
import { Person, Gender } from './types';

export const INITIAL_PEOPLE: Person[] = ${JSON.stringify(people, null, 2)};

export const COLORS = {
  male: 'border-blue-500 bg-blue-50',
  female: 'border-rose-500 bg-rose-50',
  other: 'border-slate-500 bg-slate-50',
  maleAccent: 'text-blue-600',
  femaleAccent: 'text-rose-600',
  otherAccent: 'text-slate-600'
};`;

      const encoded = btoa(unescape(encodeURIComponent(content)));

      // 3. Push to GitHub
      const putResponse = await fetch(
        `https://api.github.com/repos/${config.username}/${config.repo}/contents/constants.tsx`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${config.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Archive Update: ${new Date().toLocaleString()}`,
            content: encoded,
            sha,
            branch: config.branch || 'main'
          }),
        }
      );

      if (putResponse.ok) {
        setSyncStatus('success');
        setDeploymentCountdown(60); // Start 1 minute deployment tracker
        setTimeout(() => setSyncStatus('idle'), 5000);
      } else {
        const errorData = await putResponse.json();
        throw new Error(errorData.message || "Failed to push update.");
      }
    } catch (err: any) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
      alert(`Publishing error: ${err.message}. Check your GitHub settings.`);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('heritage_is_admin');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Navbar */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif leading-none tracking-tight">HeritageTree</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
              {isAdmin ? 'Admin Portal' : 'Ancestry Archive'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2 pr-4 mr-4 border-r border-slate-100">
              <button 
                onClick={handleQuickPublish}
                disabled={syncStatus === 'syncing' || deploymentCountdown !== null}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm relative overflow-hidden ${
                  syncStatus === 'syncing' ? 'bg-slate-100 text-slate-400' :
                  deploymentCountdown !== null ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  syncStatus === 'success' ? 'bg-emerald-500 text-white' :
                  syncStatus === 'error' ? 'bg-rose-500 text-white' :
                  'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'
                }`}
              >
                {syncStatus === 'syncing' ? (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : deploymentCountdown !== null ? (
                   <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live in {deploymentCountdown}s
                   </span>
                ) : syncStatus === 'success' ? (
                  'Updated!'
                ) : (
                  'Publish to Live'
                )}
              </button>
            </div>
          )}

          <div className="hidden lg:flex bg-slate-100 p-1 rounded-xl mr-2">
            <button 
              onClick={() => setView('tree')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'tree' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              Tree
            </button>
            <button 
              onClick={() => setView('list')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              List
            </button>
          </div>
          
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsDataModalOpen(true)}
                className="text-slate-500 hover:text-indigo-600 p-2.5 rounded-xl transition-all hover:bg-slate-50 border border-slate-100"
                title="Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                Member
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="text-slate-400 hover:text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold uppercase"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-hidden relative">
          {view === 'tree' ? (
            <TreeView people={people} onSelectPerson={setSelectedPerson} />
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-12 h-full overflow-y-auto">
              <div className="mb-10 relative">
                <input 
                  type="text" 
                  placeholder="Search ancestral records..."
                  className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl shadow-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-xl font-serif italic"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300 absolute left-5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                {filteredPeople.map(person => (
                  <PersonCard 
                    key={person.id} 
                    person={person} 
                    onClick={() => setSelectedPerson(person)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest flex-shrink-0">
          <div>© {new Date().getFullYear()} HeritageTree Archive</div>
          <div className="flex items-center gap-6">
             <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${deploymentCountdown !== null ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`}></span> 
              {deploymentCountdown !== null ? 'Deployment in progress...' : 'System Online'}
            </span>
          </div>
        </footer>
      </main>

      {/* Modals */}
      {selectedPerson && (
        <ProfileModal 
          person={selectedPerson} 
          allPeople={people}
          isAdmin={isAdmin}
          onClose={() => setSelectedPerson(null)}
          onUpdate={handleUpdatePerson}
          onEdit={() => setEditingPerson(selectedPerson)}
          onDelete={() => handleDeletePerson(selectedPerson.id)}
        />
      )}

      {isAddModalOpen && (
        <AddPersonModal 
          allPeople={people}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddPerson}
        />
      )}

      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          allPeople={people}
          onClose={() => setEditingPerson(null)}
          onSave={handleUpdatePerson}
        />
      )}

      {isLoginModalOpen && (
        <AdminLoginModal 
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsAdmin(true);
            setIsLoginModalOpen(false);
          }}
        />
      )}

      {isDataModalOpen && (
        <DataManagementModal 
          currentPeople={people}
          onClose={() => setIsDataModalOpen(false)}
          onImport={handleImportPeople}
        />
      )}

      {/* Mobile Switcher */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-lg border border-slate-200 p-1.5 rounded-2xl shadow-2xl flex gap-1 z-30">
        <button 
          onClick={() => setView('tree')}
          className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${view === 'tree' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500'}`}
        >
          Tree
        </button>
        <button 
          onClick={() => setView('list')}
          className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${view === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500'}`}
        >
          List
        </button>
      </div>
    </div>
  );
};

export default App;