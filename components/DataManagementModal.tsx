import React, { useState, useRef, useEffect } from 'react';
import { Person } from '../types';
import { parseFamilyText } from '../services/geminiService';

interface DataManagementModalProps {
  currentPeople: Person[];
  onClose: () => void;
  onImport: (people: Person[]) => void;
}

interface GitHubConfig {
  username: string;
  repo: string;
  token: string;
}

const DataManagementModal: React.FC<DataManagementModalProps> = ({ currentPeople, onClose, onImport }) => {
  const [aiText, setAiText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load GitHub config from local storage
  const [ghConfig, setGhConfig] = useState<GitHubConfig>(() => {
    const saved = localStorage.getItem('heritage_gh_config');
    return saved ? JSON.parse(saved) : { username: '', repo: '', token: '' };
  });

  useEffect(() => {
    localStorage.setItem('heritage_gh_config', JSON.stringify(ghConfig));
  }, [ghConfig]);

  const generateConstantsFile = (people: Person[]) => {
    return `import React from 'react';
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
  };

  const handleCopyForGitHub = () => {
    const code = generateConstantsFile(currentPeople);
    navigator.clipboard.writeText(code).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    });
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentPeople, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `heritage_backup.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImport(json);
          onClose();
        } else {
          setError("Invalid format.");
        }
      } catch (err) {
        setError("Error reading file.");
      }
    };
    reader.readAsText(file);
  };

  const handleAiIngest = async () => {
    if (!aiText.trim()) return;
    setIsProcessing(true);
    setError('');
    try {
      const parsedPeople = await parseFamilyText(aiText);
      if (parsedPeople.length > 0) {
        if (window.confirm(`Found ${parsedPeople.length} relatives. Replace current tree?`)) {
          onImport(parsedPeople);
          onClose();
        }
      }
    } catch (err) {
      setError("AI Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Archive Settings</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Setup One-Click Publish</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          {/* STEP 1: CONFIG */}
          <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
              Configure GitHub Live Sync
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">GitHub Username</label>
                  <input 
                    placeholder="e.g. johndoe"
                    className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                    value={ghConfig.username}
                    onChange={e => setGhConfig({...ghConfig, username: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Repository Name</label>
                  <input 
                    placeholder="e.g. family-tree"
                    className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                    value={ghConfig.repo}
                    onChange={e => setGhConfig({...ghConfig, repo: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Personal Access Token</label>
                <input 
                  type="password"
                  placeholder="Paste your token here..."
                  className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  value={ghConfig.token}
                  onChange={e => setGhConfig({...ghConfig, token: e.target.value})}
                />
              </div>
              <p className="text-[10px] text-indigo-400 font-medium px-1">
                Once saved, use the <strong>"Publish to Live"</strong> button in the header to update your site with one click.
              </p>
            </div>
          </section>

          {/* STEP 2: MANUAL ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-5 h-5 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-[10px]">2</span>
                Manual Backup
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleExport}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  <span className="text-xs font-bold text-slate-700">Download JSON</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  <span className="text-xs font-bold text-slate-700">Import File</span>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleJsonUpload} />
                </button>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">AI Smart Import</h3>
              <div className="space-y-3">
                <textarea 
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                  placeholder="Paste a family story..."
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                />
                <button 
                  onClick={handleAiIngest}
                  disabled={isProcessing || !aiText.trim()}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all ${
                    isProcessing ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isProcessing ? "AI Working..." : "Parse with Gemini AI"}
                </button>
              </div>
            </section>
          </div>
        </div>

        {error && <p className="p-4 bg-red-50 text-red-500 text-[10px] font-bold text-center border-t border-red-100">{error}</p>}

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all"
          >
            Finished Setup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManagementModal;