import React, { useState, useRef } from 'react';
import { Person } from '../types';
import { parseFamilyText } from '../services/geminiService';

interface DataManagementModalProps {
  currentPeople: Person[];
  onClose: () => void;
  onImport: (people: Person[]) => void;
}

const DataManagementModal: React.FC<DataManagementModalProps> = ({ currentPeople, onClose, onImport }) => {
  const [aiText, setAiText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentPeople, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `heritage_backup_${new Date().toISOString().split('T')[0]}.json`);
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
          setError("Invalid file format. Expected a JSON array of people.");
        }
      } catch (err) {
        setError("Error reading file. Make sure it is a valid JSON.");
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
        if (window.confirm(`AI identified ${parsedPeople.length} family members. Do you want to replace your current tree with this data?`)) {
          onImport(parsedPeople);
          onClose();
        }
      } else {
        setError("AI couldn't find any family data in that text. Try being more specific with names and dates.");
      }
    } catch (err) {
      setError("AI Service error. Please check your API key and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Data Management Portal</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Backup & Smart Ingest</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10">
          {/* File Section */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4 4v12" />
              </svg>
              File Operations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handleExport}
                className="flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <span className="font-bold text-slate-700">Export Tree</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase">Save as JSON file</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4 4v12" />
                  </svg>
                </div>
                <span className="font-bold text-slate-700">Import Tree</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase">Upload JSON backup</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleJsonUpload} 
                />
              </button>
            </div>
          </section>

          {/* AI Section */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Smart Upload
            </h3>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                Paste a story, a list, or an old record below. Gemini AI will analyze the text and automatically generate the nodes and connections.
              </p>
              <textarea 
                className="w-full h-40 bg-white border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none font-serif text-lg leading-relaxed"
                placeholder="Example: My grandfather Arthur was born in 1920. He married Martha (b. 1922) and they had two sons: Peter and David..."
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
              />
              
              {error && <p className="text-red-500 text-xs font-bold mt-3 text-center">{error}</p>}

              <button 
                onClick={handleAiIngest}
                disabled={isProcessing || !aiText.trim()}
                className={`w-full mt-4 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isProcessing 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 active:scale-95'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    AI is parsing records...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Process with Gemini AI
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        <div className="p-4 bg-slate-50 text-center border-t border-slate-100 flex justify-between px-8">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest self-center">Legacy Archive Management</p>
          <button 
            onClick={onClose}
            className="text-indigo-600 text-xs font-bold hover:underline"
          >
            Close Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManagementModal;