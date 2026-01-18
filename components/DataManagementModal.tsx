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
  branch: string;
}

const DataManagementModal: React.FC<DataManagementModalProps> = ({ currentPeople, onClose, onImport }) => {
  const [aiText, setAiText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'none' | 'success' | 'error'>('none');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ghConfig, setGhConfig] = useState<GitHubConfig>(() => {
    const saved = localStorage.getItem('heritage_gh_config');
    return saved ? JSON.parse(saved) : { username: '', repo: '', token: '', branch: 'main' };
  });

  useEffect(() => {
    localStorage.setItem('heritage_gh_config', JSON.stringify(ghConfig));
  }, [ghConfig]);

  const verifyConnection = async () => {
    if (!ghConfig.token || !ghConfig.username || !ghConfig.repo) {
      setError("Please enter your Username, Repo, and Token first.");
      setVerifyStatus('error');
      return;
    }

    setIsVerifying(true);
    setError('');
    setVerifyStatus('none');

    try {
      const response = await fetch(
        `https://api.github.com/repos/${ghConfig.username}/${ghConfig.repo}`,
        {
          headers: {
            Authorization: `token ${ghConfig.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        setVerifyStatus('success');
      } else {
        const data = await response.json();
        throw new Error(data.message || "Connection failed. Check your details.");
      }
    } catch (err: any) {
      setError(err.message);
      setVerifyStatus('error');
    } finally {
      setIsVerifying(false);
    }
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
          setError("Invalid JSON format.");
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
        if (window.confirm(`AI identified ${parsedPeople.length} people. Update tree?`)) {
          onImport(parsedPeople);
          onClose();
        }
      }
    } catch (err) {
      setError("AI analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-serif">Cloud Sync Setup</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Connect to your live website</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          {/* STEP 1: GITHUB CONFIG */}
          <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px] font-bold shadow-lg shadow-indigo-100">1</span>
                GitHub Deployment Settings
              </h3>
              <button 
                onClick={verifyConnection}
                disabled={isVerifying}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  verifyStatus === 'success' ? 'bg-emerald-500 text-white border-emerald-400' :
                  verifyStatus === 'error' ? 'bg-rose-500 text-white border-rose-400' :
                  'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                {isVerifying ? 'Verifying...' : verifyStatus === 'success' ? 'Connected ✓' : verifyStatus === 'error' ? 'Failed !' : 'Verify Connection'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Username</label>
                  <input 
                    placeholder="e.g. janesmith"
                    className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-semibold"
                    value={ghConfig.username}
                    onChange={e => setGhConfig({...ghConfig, username: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Repo Name</label>
                  <input 
                    placeholder="e.g. heritage-tree"
                    className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-semibold"
                    value={ghConfig.repo}
                    onChange={e => setGhConfig({...ghConfig, repo: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Personal Token</label>
                  <input 
                    type="password"
                    placeholder="Paste your GitHub PAT..."
                    className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-semibold"
                    value={ghConfig.token}
                    onChange={e => setGhConfig({...ghConfig, token: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Branch</label>
                  <input 
                    placeholder="main"
                    className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-semibold"
                    value={ghConfig.branch}
                    onChange={e => setGhConfig({...ghConfig, branch: e.target.value || 'main'})}
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-100/30 rounded-xl border border-indigo-100 mt-2">
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  <strong>How to use:</strong> Once configured, click the blue button in the main header of the site. It will push your current tree data to GitHub. Your hosting (Vercel/Netlify) will detect this and update your live site automatically.
                </p>
              </div>
            </div>
          </section>

          {/* STEP 2: MANUAL ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center text-[10px] font-bold">2</span>
                Manual Backup
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleExport}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all group"
                >
                  <span className="text-xs font-bold text-slate-700">Export JSON</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all group"
                >
                  <span className="text-xs font-bold text-slate-700">Import File</span>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleJsonUpload} />
                </button>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">AI Ingest</h3>
              <div className="space-y-3">
                <textarea 
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none font-medium"
                  placeholder="Paste a family record to parse..."
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                />
                <button 
                  onClick={handleAiIngest}
                  disabled={isProcessing || !aiText.trim()}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-md ${
                    isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black'
                  }`}
                >
                  {isProcessing ? "Analyzing..." : "Gemini AI Parse"}
                </button>
              </div>
            </section>
          </div>
        </div>

        {error && <p className="mx-8 mb-4 p-3 bg-red-50 text-red-600 text-[10px] font-bold text-center rounded-xl border border-red-100">{error}</p>}

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManagementModal;