import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api'; // Your Axios instance
import { Shield, Zap, BookOpen, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const CodeAuditor = () => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, SUBMITTING, POLLING, COMPLETED, FAILED
  const [auditData, setAuditData] = useState(null);
  const [error, setError] = useState('');
  
  const pollingIntervalRef = useRef(null);

  // Cleanup the interval if the user navigates away
  useEffect(() => {
    return () => clearInterval(pollingIntervalRef.current);
  }, []);

  const startAudit = async () => {
    if (!code.trim()) return;
    
    setStatus('SUBMITTING');
    setError('');
    setAuditData(null);

    try {
      // 1. Submit the code to Django
      const res = await api.post('audit/submit/', { code });
      const auditId = res.data.audit_id;
      
      setStatus('POLLING');
      
      // 2. Start polling for results every 2.5 seconds
      pollingIntervalRef.current = setInterval(() => checkStatus(auditId), 2500);
      
    } catch (err) {
      console.error(err);
      setError('Failed to submit code for audit.');
      setStatus('FAILED');
    }
  };

  const checkStatus = async (auditId) => {
    try {
      const res = await api.get(`audit/${auditId}/status/`);
      const currentStatus = res.data.status;

      if (currentStatus === 'COMPLETED') {
        clearInterval(pollingIntervalRef.current);
        setAuditData(res.data);
        setStatus('COMPLETED');
      } else if (currentStatus === 'FAILED') {
        clearInterval(pollingIntervalRef.current);
        setError('The AI worker failed to process this snippet.');
        setStatus('FAILED');
      }
      // If PENDING or PROCESSING, we just let the interval run...
    } catch (err) {
      clearInterval(pollingIntervalRef.current);
      setError('Connection to server lost.');
      setStatus('FAILED');
    }
  };

  // Helper to color-code the scores mapping to your custom CSS classes
  const getScoreTheme = (score) => {
    if (score >= 8) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto flex gap-6 h-full">
      
      {/* Left Panel: The Code Editor */}
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">AI Code Auditor</h2>
          <p className="text-slate-400 text-sm">Submit monolithic code for deep architectural analysis.</p>
        </div>
        
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here..."
          className="code-auditor-textarea"
        />

        <button
          onClick={startAudit}
          disabled={status === 'SUBMITTING' || status === 'POLLING' || !code.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          {status === 'SUBMITTING' && <Loader2 className="animate-spin w-5 h-5" />}
          {status === 'POLLING' && <Loader2 className="animate-spin w-5 h-5 text-indigo-400" />}
          
          {status === 'IDLE' || status === 'COMPLETED' || status === 'FAILED' ? 'Run Deep Audit' : 
           status === 'SUBMITTING' ? 'Submitting to Queue...' : 'AI is Analyzing...'}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {/* Right Panel: The Results Dashboard */}
      <div className="w-[450px] bg-[#121212] rounded-xl border border-slate-800 p-6 flex flex-col overflow-y-auto">
        
        {/* Loading / Idle States */}
        {status === 'IDLE' && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
            <Shield className="w-12 h-12 mb-4 opacity-20" />
            <p>Awaiting code submission.</p>
          </div>
        )}

        {(status === 'POLLING' || status === 'SUBMITTING') && (
          <div className="flex-1 flex flex-col items-center justify-center text-indigo-400 text-center">
            <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-80" />
            <p className="animate-pulse">Gemini 2.5 is evaluating architecture...</p>
          </div>
        )}

        {/* Completed Dashboard State */}
        {status === 'COMPLETED' && auditData && (
          <div className="audit-dashboard">
            
            <div className="audit-header">
              <CheckCircle className="text-success" size={28} />
              Deep Audit Complete
            </div>

            {/* Top Row: Score Cards */}
            <div className="score-grid">
              <div className="score-card">
                <Shield className={getScoreTheme(auditData.security_score)} size={24} />
                <div className={`score-value ${getScoreTheme(auditData.security_score)}`}>
                  {auditData.security_score}<small>/10</small>
                </div>
                <div className="score-label">Security</div>
              </div>

              <div className="score-card">
                <Zap className={getScoreTheme(auditData.performance_score)} size={24} />
                <div className={`score-value ${getScoreTheme(auditData.performance_score)}`}>
                  {auditData.performance_score}<small>/10</small>
                </div>
                <div className="score-label">Performance</div>
              </div>

              <div className="score-card">
                <BookOpen className={getScoreTheme(auditData.readability_score)} size={24} />
                <div className={`score-value ${getScoreTheme(auditData.readability_score)}`}>
                  {auditData.readability_score}<small>/10</small>
                </div>
                <div className="score-label">Readability</div>
              </div>
            </div>

            {/* Detailed Feedback Mapping with Auto-Refactoring */}
            <div className="space-y-4 mt-6">
              
              {/* 1. Security Risks */}
              {auditData.feedback?.security_issues?.length > 0 && (
                <div className="feedback-card border-danger">
                  <h3 className="text-danger flex items-center gap-2"><Shield size={18}/> Security Risks</h3>
                  <div className="flex flex-col gap-4 mt-3">
                    {auditData.feedback.security_issues.map((issue, i) => (
                      <div key={i} className="pl-3 border-l-2 border-slate-700 pb-2">
                        <strong className="text-white block mb-1">{issue.title}</strong>
                        <p className="text-slate-300 text-sm mb-3 leading-relaxed">{issue.description}</p>
                        
                        {issue.refactor && (
                          <div className="refactor-box">
                            <div className="refactor-header">
                              <span>Suggested Refactor</span>
                              <span className="uppercase text-indigo-400">{issue.language || 'code'}</span>
                            </div>
                            <pre className="refactor-code">
                              <code>{issue.refactor}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Performance Bottlenecks */}
              {auditData.feedback?.performance_bottlenecks?.length > 0 && (
                <div className="feedback-card border-warning mt-4">
                  <h3 className="text-warning flex items-center gap-2"><Zap size={18}/> Performance Bottlenecks</h3>
                  <div className="flex flex-col gap-4 mt-3">
                    {auditData.feedback.performance_bottlenecks.map((issue, i) => (
                      <div key={i} className="pl-3 border-l-2 border-slate-700 pb-2">
                        <strong className="text-white block mb-1">{issue.title}</strong>
                        <p className="text-slate-300 text-sm mb-3 leading-relaxed">{issue.description}</p>
                        
                        {issue.refactor && (
                          <div className="refactor-box">
                            <div className="refactor-header">
                              <span>Suggested Refactor</span>
                              <span className="uppercase text-indigo-400">{issue.language || 'code'}</span>
                            </div>
                            <pre className="refactor-code">
                              <code>{issue.refactor}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Readability Notes */}
              {auditData.feedback?.readability_improvements?.length > 0 && (
                <div className="feedback-card border-success mt-4">
                  <h3 className="text-success flex items-center gap-2"><BookOpen size={18}/> Readability Notes</h3>
                  <div className="flex flex-col gap-4 mt-3">
                    {auditData.feedback.readability_improvements.map((issue, i) => (
                      <div key={i} className="pl-3 border-l-2 border-slate-700 pb-2">
                        <strong className="text-white block mb-1">{issue.title}</strong>
                        <p className="text-slate-300 text-sm mb-3 leading-relaxed">{issue.description}</p>
                        
                        {issue.refactor && (
                          <div className="refactor-box">
                            <div className="refactor-header">
                              <span>Suggested Refactor</span>
                              <span className="uppercase text-indigo-400">{issue.language || 'code'}</span>
                            </div>
                            <pre className="refactor-code">
                              <code>{issue.refactor}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeAuditor;