
import React, { useState } from 'react';
import { Person, Gender } from '../types';
import { generateBio } from '../services/geminiService';

interface ProfileModalProps {
  person: Person;
  allPeople: Person[];
  isAdmin: boolean;
  onClose: () => void;
  onUpdate: (updated: Person) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ person, allPeople, isAdmin, onClose, onUpdate, onEdit, onDelete }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const father = allPeople.find(p => p.id === person.fatherId);
  const mother = allPeople.find(p => p.id === person.motherId);
  const children = allPeople.filter(p => p.fatherId === person.id || p.motherId === person.id);

  const handleGenerateBio = async () => {
    if (!isAdmin) return;
    setIsGenerating(true);
    const familyContext = `${person.firstName} is the child of ${father?.firstName || 'unknown'} and ${mother?.firstName || 'unknown'}. They have ${children.length} children.`;
    const newBio = await generateBio(person, familyContext);
    onUpdate({ ...person, bio: newBio });
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header/Cover - REMOVED overflow-hidden to allow profile pic to bleed out */}
        <div className="relative h-40 bg-slate-900 flex-shrink-0">
          {/* Background pattern container (clipped) */}
          <div className="absolute inset-0 overflow-hidden rounded-t-2xl pointer-events-none">
            <div className="absolute inset-0 opacity-20">
               <div className="w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
            </div>
          </div>
          
          {/* Profile Image - Overlapping the border */}
          <div className="absolute -bottom-12 left-8 p-1.5 bg-white rounded-2xl shadow-xl z-20">
            <img 
              src={person.photoUrl || `https://picsum.photos/seed/${person.id}/200/200`} 
              className="w-24 h-24 rounded-xl object-cover border border-slate-100"
              alt={person.firstName}
            />
          </div>
          
          <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
            {isAdmin && (
              <>
                <button 
                  onClick={onEdit}
                  title="Edit Profile"
                  className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors backdrop-blur-md border border-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button 
                  onClick={onDelete}
                  title="Remove Person"
                  className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full transition-colors backdrop-blur-md border border-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors ml-2 backdrop-blur-md border border-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 px-8 pb-8 overflow-y-auto flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-800">
                {person.firstName} {person.lastName}
              </h2>
              <p className="text-slate-500 font-medium">
                {person.maidenName && `née ${person.maidenName} • `} 
                {new Date(person.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                {person.deathDate && ` — ${new Date(person.deathDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${person.gender === Gender.MALE ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
              {person.gender}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Biography</h3>
                {isAdmin && (
                  <button 
                    onClick={handleGenerateBio}
                    disabled={isGenerating}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {isGenerating ? 'Drafting...' : 'Update with AI'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-700 leading-relaxed font-serif text-lg relative group min-h-[120px]">
                {person.bio || "This chapter of our family history is waiting to be written."}
                {!isAdmin && !person.bio && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm font-medium text-slate-400">Restricted Record</p>
                  </div>
                )}
              </div>

              {person.occupation && (
                <div className="mt-4 flex items-center gap-2 text-slate-600">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Worked as a <strong>{person.occupation}</strong></span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Lineage</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Father</p>
                    <p className="text-sm font-semibold">{father ? `${father.firstName} ${father.lastName}` : 'Unknown'}</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Mother</p>
                    <p className="text-sm font-semibold">{mother ? `${mother.firstName} ${mother.lastName}` : 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {children.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Children</h3>
                  <div className="flex flex-wrap gap-2">
                    {children.map(child => (
                      <span key={child.id} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">
                        {child.firstName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
