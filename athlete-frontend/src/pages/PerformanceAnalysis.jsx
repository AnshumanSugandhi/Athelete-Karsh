import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import api from '../api';

export default function PerformanceAnalysis() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [aiInsights, setAiInsights] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPerformanceLogs();
  }, []);

  const fetchPerformanceLogs = async () => {
    try {
      const response = await api.get('performance/');
      // Reverse array so chronological order works for Recharts
      setLogs(response.data.reverse());
    } catch (error) {
      console.error('Failed to fetch performance logs:', error);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    setAiInsights('');
    try {
      const response = await api.get('performance/ai_analysis/');
      setAiInsights(response.data.analysis);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setAiInsights('⚠️ Error generating insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Performance Analysis</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your metrics and get AI-powered diet, exercise, and recovery plans.
          </p>
        </div>
        <button
          onClick={() => navigate('/athlete')}
          className="text-sm text-slate-600 hover:text-slate-900 border border-slate-300 px-4 py-2 rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart 1: Fatigue & Exertion */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Strain Analysis</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logs} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    name="Fatigue (1-10)"
                    dataKey="fatigue_level" 
                    stroke="#ef4444" // Energetic Red
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ef4444', strokeWidth: 2 }}
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    name="Exertion (1-10)"
                    dataKey="perceived_exertion" 
                    stroke="#f97316" // Vibrant Orange
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#f97316', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Sleep & Training Duration */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Recovery & Effort</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logs} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  {/* Left Y Axis for Sleep */}
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                  {/* Right Y Axis for Duration */}
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    name="Sleep (hrs)"
                    dataKey="sleep_hours" 
                    stroke="#0f172a" // Deep Black/Slate
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    name="Training (mins)"
                    dataKey="training_duration_mins" 
                    stroke="#ef4444" // Energetic Red
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ef4444', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights (1/3 width) */}
        <div className="bg-gradient-to-br from-slate-900 to-black rounded-2xl shadow-xl border border-slate-800 p-6 flex flex-col h-full min-h-[600px]">
          
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zm0 14l-10-5v2l10 5 10-5v-2l-10 5zm0 4l-10-5v2l10 5 10-5v-2l-10 5z"/>
              </svg>
              AI Insights
            </h2>
          </div>

          {!aiInsights && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Ready to Analyze</h3>
              <p className="text-slate-400 text-sm mb-8">
                Generate a custom diet, exercise, and recovery plan based on your latest metrics.
              </p>
              <button
                onClick={generateInsights}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-red-500/25"
              >
                Generate Plan
              </button>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm animate-pulse">Analyzing performance data...</p>
            </div>
          )}

          {aiInsights && !loading && (
            <div className="flex-1 flex flex-col">
              <div className="prose prose-invert prose-sm max-w-none flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {/* 
                  ReactMarkdown is used here to securely render the markdown string 
                  returned by the Gemini API into HTML elements.
                */}
                <ReactMarkdown>{aiInsights}</ReactMarkdown>
              </div>
              <button
                onClick={generateInsights}
                className="mt-6 w-full bg-slate-800 text-white font-medium py-3 px-4 rounded-xl hover:bg-slate-700 transition"
              >
                Refresh Analysis
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
