
import React, { useState, useEffect, useMemo } from 'react';
import { Person, ViewType } from './types';
import { INITIAL_PEOPLE } from './constants';
import TreeView from './components/TreeView';
import PersonCard from './components/PersonCard';
import ProfileModal from './components/ProfileModal';
import AddPersonModal from './components/AddPersonModal';
import EditPersonModal from './components/EditPersonModal';
import AdminLoginModal from './components/AdminLoginModal';

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
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleDeletePerson = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Are you sure you want to remove this person from the family records?")) return;
    
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

        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl mr-2">
            <button 
              onClick={() => setView('tree')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'tree' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              Tree View
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
                title="Log out from Admin"
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
                  placeholder="Search ancestors, descendants, relatives..."
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
                {filteredPeople.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-400 font-medium">No family members found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 px-6 py-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest flex-shrink-0">
          <div>© {new Date().getFullYear()} HeritageTree Archive</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Live Record
            </span>
            <span className="hidden md:inline">Preserving history, one generation at a time</span>
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

      {/* Mobile Nav Toggle */}
      <div className="md:hidden fixed bottom-14 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur border border-slate-200 p-1 rounded-2xl shadow-xl flex gap-1 z-20">
        <button 
          onClick={() => setView('tree')}
          className={`px-6 py-2 rounded-xl text-sm font-bold ${view === 'tree' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
        >
          Tree
        </button>
        <button 
          onClick={() => setView('list')}
          className={`px-6 py-2 rounded-xl text-sm font-bold ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
        >
          List
        </button>
      </div>
    </div>
  );
};

export default App;
