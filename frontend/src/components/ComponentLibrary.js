import React, { useState, useEffect, useCallback } from 'react';
import { LayoutTemplate, Plus, Save, Trash2, Play, Code, CheckCircle2, Box, Loader2 } from 'lucide-react';
import api from '../services/api';

// --- IDE Imports ---
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-tomorrow.css';

const ComponentLibrary = () => {
  const [snippets, setSnippets] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('<div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4">\n  <div class="shrink-0">\n    <div class="h-12 w-12 bg-indigo-500 rounded-full"></div>\n  </div>\n  <div>\n    <div class="text-xl font-medium text-black">Modern Card</div>\n    <p class="text-slate-500">Tailwind injected automatically!</p>\n  </div>\n</div>');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // --- NEW PERFORMANCE STATES ---
  const [debouncedCode, setDebouncedCode] = useState(code);
  const [isRendering, setIsRendering] = useState(false);

  // --- NEW DEBOUNCE HOOK ---
  useEffect(() => {
    setIsRendering(true); // Turn on the loader the second you type
    const handler = setTimeout(() => {
      setDebouncedCode(code); // Update the iframe only after 600ms of no typing
    }, 600);

    return () => clearTimeout(handler); // Cancel the timer if you keep typing
  }, [code]);
  // Fetch saved snippets from Django
  const fetchSnippets = useCallback(async () => {
    try {
      const res = await api.get('components/');
      setSnippets(res.data);
    } catch (err) {
      console.error("Failed to fetch snippets", err);
    }
  }, []);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  // Load a snippet into the editor
  const loadSnippet = (snippet) => {
    setActiveId(snippet.id);
    setTitle(snippet.title);
    setCode(snippet.code);
    setDebouncedCode(snippet.code);
  };

  // Create a new blank slate
  const handleNew = () => {
    setActiveId(null);
    setTitle('');
    setCode('<div class="p-4 text-white bg-blue-600 rounded-lg shadow">\n  Start building...\n</div>');
  };

  // Save to Django
  const handleSave = async () => {
    if (!title.trim() || !code.trim()) {
      alert("Please provide a title and some code.");
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = { title, code, description: 'UI Snippet' };
      let newId = activeId;
      
      if (activeId) {
        await api.put(`components/${activeId}/`, payload);
      } else {
        const res = await api.post('components/', payload);
        newId = res.data.id;
        setActiveId(newId);
      }
      
      await fetchSnippets();
      
      // Flash the success icon
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      
    } catch (err) {
      console.error("Failed to save snippet", err);
      alert("Failed to save component. Check console.");
    }
    setIsSaving(false);
  };

  // Delete from Django
  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent the card click event from firing
    if (!window.confirm("Are you sure you want to delete this component?")) return;
    try {
      await api.delete(`components/${id}/`);
      if (activeId === id) handleNew();
      await fetchSnippets();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  // The Magic: Injects Tailwind and Custom Scrollbars into the iframe
  const generatePreviewHtml = (htmlCode) => `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { margin: 0; padding: 16px; background-color: #121212; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: #121212; }
          ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
        </style>
      </head>
      <body>
        ${htmlCode}
      </body>
    </html>
  `;

  return (
    <div className="fade-in" style={{ display: 'flex', height: 'calc(100vh - 40px)', gap: '24px' }}>
      
      {/* Left Sidebar: Component List */}
      <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button 
          onClick={handleNew}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'var(--text-main)', color: 'var(--bg-main)', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'transform 0.1s' }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={18} /> New Component
        </button>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0', paddingLeft: '4px' }}>Saved Snippets</h4>
          
          {snippets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: '12px' }}>
              <Box size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No components yet.</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Create one to see it here!</p>
            </div>
          ) : (
            snippets.map(s => (
              <div 
                key={s.id}
                onClick={() => loadSnippet(s)}
                style={{ 
                  padding: '16px', 
                  backgroundColor: activeId === s.id ? '#1e293b' : 'transparent',
                  border: `1px solid ${activeId === s.id ? '#3b82f6' : 'var(--border-subtle)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LayoutTemplate size={16} color={activeId === s.id ? '#3b82f6' : "var(--text-muted)"} />
                    <span style={{ fontWeight: 500, color: activeId === s.id ? '#fff' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>
                      {s.title || 'Untitled Component'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '24px' }}>HTML / Tailwind</span>
                </div>
                
                <Trash2 
                  size={16} 
                  color="#ef4444" 
                  style={{ cursor: 'pointer', opacity: activeId === s.id ? 1 : 0.5, transition: 'opacity 0.2s' }} 
                  onClick={(e) => handleDelete(s.id, e)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Area: IDE and Preview Split */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
        
        {/* Header toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your component..."
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 600, outline: 'none', width: '50%' }}
          />
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
              background: saveSuccess ? '#10b981' : 'transparent', 
              color: saveSuccess ? '#fff' : '#10b981', 
              border: `1px solid #10b981`, 
              borderRadius: '8px', cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: 500
            }}
          >
            {saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />} 
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Snippet'}
          </button>
        </div>

        {/* 50/50 Split Container */}
        <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: 0 }}>
          
          {/* Top/Left: Code Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', color: 'var(--text-muted)' }}><Code size={16} /> HTML / Tailwind Editor</h4>
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <Editor
                value={code}
                onValueChange={code => setCode(code)}
                highlight={code => Prism.highlight(code, Prism.languages.markup, 'markup')}
                padding={20}
                style={{ fontFamily: '"Fira Code", "Consolas", monospace', fontSize: 14, minHeight: '100%', outline: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              />
            </div>
          </div>

          {/* Bottom/Right: Live Preview iframe */}
          {/* Bottom/Right: Live Preview iframe */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 12px 0', color: '#3b82f6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Play size={16} /> Live Sandboxed Preview</span>
            </h4>
            
            <div style={{ flex: 1, backgroundColor: '#121212', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden', position: 'relative' }}>
              
              {/* The Loading Overlay */}
              {isRendering && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18, 18, 18, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: '#3b82f6' }}>
                  <style>
                    {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
                  </style>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '1px' }}>Compiling Tailwind...</span>
                </div>
              )}

              {/* The Iframe */}
              <iframe
                title="preview"
                srcDoc={generatePreviewHtml(debouncedCode)} // Use debouncedCode here!
                sandbox="allow-scripts"
                onLoad={() => setIsRendering(false)} // Turn off loader when Tailwind finishes parsing
                style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ComponentLibrary;