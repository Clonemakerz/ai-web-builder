"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Undo, Redo, Moon, Sun, Code as CodeIcon, Eye, Download, Save, Trash2, Copy, Sparkles, Menu, X as CloseIcon } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  code: string;
}

interface StatusMessage {
  msg: string;
  type: string;
}

export default function AIWebBuilder() {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<StatusMessage>({ msg: '', type: '' });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pro-ai-projects');
    if (saved) {
      try {
        setSavedProjects(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load projects:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (status.msg) {
      const timer = setTimeout(() => setStatus({ msg: '', type: '' }), 2500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const addToHistory = useCallback((newCode: string): void => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCode);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCode(newCode);
  }, [history, historyIndex]);

  const undo = useCallback((): void => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCode(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const redo = useCallback((): void => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCode(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  const handleGenerate = useCallback(async (): Promise<void> => {
    if (!prompt.trim()) {
      setStatus({ msg: '✍️ Please enter a prompt!', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ msg: '🤖 AI is creating...', type: 'info' });
    setSidebarOpen(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (data.html) {
        addToHistory(data.html);
        setActiveTab('preview');
        setStatus({ msg: '✨ Done!', type: 'success' });
      } else {
        setStatus({ msg: `❌ ${data.error}`, type: 'error' });
      }
    } catch (err) {
      setStatus({ msg: '❌ Connection failed', type: 'error' });
    }
    setLoading(false);
  }, [prompt, addToHistory]);

  const saveToLocalDB = useCallback((): void => {
    if (!code) {
      setStatus({ msg: '❌ No code!', type: 'error' });
      return;
    }
    const project: Project = {
      id: Date.now(),
      name: prompt.substring(0, 40) || 'Untitled',
      code,
    };
    const updated = [project, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem('pro-ai-projects', JSON.stringify(updated));
    setStatus({ msg: '💾 Saved!', type: 'success' });
  }, [code, prompt, savedProjects]);

  const copyToClipboard = useCallback(async (): Promise<void> => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setStatus({ msg: '📋 Copied!', type: 'success' });
  }, [code]);

  const downloadHTML = useCallback((): void => {
    if (!code) return;
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"><\/script>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body>
${code}
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `design-${Date.now()}.html`;
    link.click();
  }, [code]);

  const deleteProject = useCallback((id: number, e: React.MouseEvent): void => {
    e.stopPropagation();
    const updated = savedProjects.filter((p: Project) => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('pro-ai-projects', JSON.stringify(updated));
  }, [savedProjects]);

  const loadProject = useCallback((project: Project): void => {
    setCode(project.code);
    addToHistory(project.code);
    setPrompt(project.name);
    setSidebarOpen(false);
  }, [addToHistory]);

  const iframeContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"><\/script>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
</style>
</head>
<body>
${code || '<div style="height:100vh; display:flex; align-items:center; justify-content:center; color:#94a3b8; flex-direction: column; gap: 20px;"><h1 style="font-size: 20px;">✨ Create magic</h1><p>Enter a prompt above</p></div>'}
</body>
</html>`;

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed left-0 top-0 bottom-0 w-80 z-50 transform transition-transform duration-300 flex flex-col border-r ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2 font-bold text-lg"><Sparkles size={20} className="text-blue-500" /> EMERGE</div>
          <button onClick={() => setSidebarOpen(false)} className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><CloseIcon size={20} /></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <section>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Your Prompt</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Design a landing page..." className={`w-full h-28 p-3 text-xs rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`} />
            <button onClick={handleGenerate} disabled={loading} className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={16} />}
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </section>
          <section>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Projects ({savedProjects.length})</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedProjects.map((p: Project) => (
                <div key={p.id} onClick={() => loadProject(p)} className={`group p-3 rounded-lg border cursor-pointer ${darkMode ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-500'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{p.name}</p></div>
                    <button onClick={(e) => deleteProject(p.id, e)} className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className={`p-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button onClick={() => setDarkMode(!darkMode)} className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />} {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={`h-12 flex items-center justify-between px-3 gap-2 border-b ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Menu size={20} /></button>
          <div className={`flex p-0.5 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button onClick={() => setActiveTab('preview')} className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1 ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><Eye size={12} /> Preview</button>
            <button onClick={() => setActiveTab('code')} className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1 ${activeTab === 'code' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><CodeIcon size={12} /> Code</button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={undo} disabled={historyIndex <= 0} className="p-2 disabled:opacity-30"><Undo size={16} /></button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 disabled:opacity-30"><Redo size={16} /></button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeTab === 'preview' ? (
            <>
              <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-2">
                <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
                  <iframe ref={iframeRef} srcDoc={iframeContent} className="w-full h-full border-none" title="Preview" sandbox="allow-same-origin allow-scripts allow-popups allow-forms" />
                </div>
              </div>
              <div className={`h-14 flex items-center justify-around border-t gap-2 px-2 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                <button onClick={saveToLocalDB} disabled={!code} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Save size={14} /> Save</button>
                <button onClick={copyToClipboard} disabled={!code} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Copy size={14} /> Copy</button>
                <button onClick={downloadHTML} disabled={!code} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Download size={14} /> Export</button>
              </div>
            </>
          ) : (
            <>
              <textarea value={code} onChange={(e) => setCode(e.target.value)} className={`flex-1 p-4 font-mono text-xs outline-none resize-none ${darkMode ? 'bg-slate-900 text-emerald-400' : 'bg-white text-slate-800'}`} spellCheck="false" />
              <div className={`h-12 flex items-center justify-around border-t px-2 gap-2 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                <button onClick={copyToClipboard} disabled={!code} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Copy size={14} /> Copy</button>
                <button onClick={downloadHTML} disabled={!code} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Download size={14} /> Export</button>
              </div>
            </>
          )}
        </div>
      </div>
      {status.msg && (
        <div className={`fixed bottom-20 left-4 right-4 px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-2 text-sm font-bold animate-bounce z-40 ${status.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-200' : status.type === 'info' ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'bg-emerald-500/20 border-emerald-500 text-emerald-200'}`}>
          {status.type === 'info' && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
          <span>{status.msg}</span>
        </div>
      )}
    </div>
  );
}
