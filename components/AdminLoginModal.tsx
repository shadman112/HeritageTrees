
import React, { useState } from 'react';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For prototype purposes, using "admin" as the key. 
    // In a real app, this would query a backend/Firebase Auth.
    if (password === 'admin') {
      onSuccess();
    } else {
      setError('Invalid administration key.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">Heritage Admin</h2>
          <p className="text-slate-500 text-sm mb-8">Enter your administration key to unlock management tools.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input 
                autoFocus
                type="password" 
                placeholder="Administration Key"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-center text-lg tracking-widest"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            
            <div className="flex flex-col gap-2 pt-4">
              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
              >
                Unlock Access
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="w-full py-3 text-slate-400 font-semibold hover:text-slate-600 text-sm"
              >
                Return to Archive
              </button>
            </div>
          </form>
        </div>
        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure Legacy Gateway</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
