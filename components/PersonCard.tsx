
import React from 'react';
import { Person, Gender } from '../types';
import { COLORS } from '../constants';

interface PersonCardProps {
  person: Person;
  onClick: () => void;
}

const PersonCard: React.FC<PersonCardProps> = ({ person, onClick }) => {
  const genderColor = person.gender === Gender.MALE ? COLORS.male : person.gender === Gender.FEMALE ? COLORS.female : COLORS.other;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-95 text-left w-full ${genderColor} bg-white`}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
        <img 
          src={person.photoUrl || `https://picsum.photos/seed/${person.id}/100/100`} 
          alt={person.firstName} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-800 leading-tight">
          {person.firstName} {person.lastName}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {new Date(person.birthDate).getFullYear()} — {person.deathDate ? new Date(person.deathDate).getFullYear() : 'Present'}
        </p>
      </div>
      <div className="flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </button>
  );
};

export default PersonCard;
