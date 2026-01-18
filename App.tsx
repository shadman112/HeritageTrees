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
  
  // Sync status for the "One-Click" publish button
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    localStorage.setItem('heritage_people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('heritage_is_admin', isAdmin.toString());
  }, [isAdmin]);

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
    if (!window.confirm("Are you sure you want to remove this person?")) return;
    
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
      // 1. Get SHA
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${config.username}/${config.repo}/contents/constants.tsx`,
        {
          headers: {
            Authorization: `token ${config.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!getFileResponse.ok) throw new Error("Repo not found");
      const { sha } = await getFileResponse.json();

      // 2. Format content
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

      // 3. Push
      const putResponse = await fetch(
        `https://api.github.com/repos/${config.username}/${config.repo}/contents/constants.tsx`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${config.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Web Update: ${new Date().toLocaleString()}`,
            content: encoded,
            sha,
          }),
        }
      );

      if (putResponse.ok) {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        throw new Error("Push failed");
      }
    } catch (err) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
      alert("Publishing failed. Please check your GitHub settings in the Data Portal.");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('heritage_is_admin');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif leading-none">HeritageTree</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
              {isAdmin ? 'Administration Portal' : 'Ancestry & Legacy Archive'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2 pr-4 mr-4 border-r border-slate-100">
              <button 
                onClick={handleQuickPublish}
                disabled={syncStatus === 'syncing'}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                  syncStatus === 'syncing' ? 'bg-slate-100 text-slate-400' :
                  syncStatus === 'success' ? 'bg-emerald-500 text-white shadow-emerald-100' :
                  syncStatus === 'error' ? 'bg-red-500 text-white' :
                  'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'
                }`}
              >
                {syncStatus === 'syncing' ? (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : syncStatus === 'success' ? (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
                {syncStatus === 'syncing' ? 'Publishing...' : syncStatus === 'success' ? 'Live!' : 'Publish to Live'}
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
              Directory
            </button>
          </div>
          
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsDataModalOpen(true)}
                className="text-slate-500 hover:text-indigo-600 p-2.5 rounded-xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100"
                title="Settings & Sync"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Member
              </button>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-600 p-2 rounded-xl transition-colors"
                title="Log out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="text-slate-400 hover:text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Access
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-hidden relative">
          {view === 'tree' ? (
            <div className="w-full h-full p-4 pb-0">
              <TreeView people={people} onSelectPerson={setSelectedPerson} />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-8 h-full overflow-y-auto">
              <div className="mb-8 relative">
                <input 
                  type="text" 
                  placeholder="Search family records..."
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-lg"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
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
        <footer className="bg-white border-t border-slate-100 px-6 py-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest flex-shrink-0">
          <div>© {new Date().getFullYear()} HeritageTree</div>
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'success' ? 'bg-emerald-400' : 'bg-slate-300'}`}></span> 
              Cloud Sync Ready
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

      {/* Mobile Nav Toggle */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-slate-200 p-1.5 rounded-2xl shadow-2xl flex gap-1 z-20">
        <button 
          onClick={() => setView('tree')}
          className={`px-6 py-2 rounded-xl text-sm font-bold ${view === 'tree' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500'}`}
        >
          Tree
        </button>
        <button 
          onClick={() => setView('list')}
          className={`px-6 py-2 rounded-xl text-sm font-bold ${view === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500'}`}
        >
          Directory
        </button>
      </div>
    </div>
  );
};

export default App;