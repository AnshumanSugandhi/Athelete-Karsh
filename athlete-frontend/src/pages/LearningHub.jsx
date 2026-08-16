// src/pages/LearningHub.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

export default function LearningHub() {
  const role = sessionStorage.getItem('user_role');
  
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  
  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sportsList, setSportsList] = useState([]);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'TECHNICAL', sport: '', video_url: '', content: ''
  });

  useEffect(() => {
    fetchModules();
    if (role === 'ADMIN') {
      fetchSports();
    }
  }, [role]);

  const fetchModules = async () => {
    try {
      const response = await api.get('learning/');
      setModules(response.data.results || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch modules', error);
      setLoading(false);
    }
  };

  const fetchSports = async () => {
    try {
      const response = await api.get('sports/');
      setSportsList(response.data.results || response.data);
    } catch (error) { console.error('Failed to fetch sports', error); }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean up empty sport to null
      const payload = { ...formData, sport: formData.sport || null };
      await api.post('learning/', payload);
      setShowCreateModal(false);
      setFormData({ title: '', description: '', category: 'TECHNICAL', sport: '', video_url: '', content: '' });
      fetchModules();
      alert('Module created successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to create module.');
    }
  };

  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading learning modules...</div>;

  return (
    <div className="w-full">
      
      {selectedModule ? (
        <div className="max-w-4xl mx-auto p-8">
          <button 
            onClick={() => setSelectedModule(null)} 
            className="mb-6 text-amber-600 font-bold hover:underline"
          >
            &larr; Back to Hub
          </button>
          
          <h1 className="text-4xl font-bold text-slate-800 mb-2">{selectedModule.title}</h1>
          <p className="text-slate-500 mb-6">
            Category: {selectedModule.category} {selectedModule.sport_name ? `| Sport: ${selectedModule.sport_name}` : ''}
          </p>
          
          {selectedModule.video_url && getYoutubeVideoId(selectedModule.video_url) && (
            <div className="aspect-w-16 aspect-h-9 mb-8 bg-black rounded-xl overflow-hidden shadow-lg">
              <iframe 
                src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedModule.video_url)}`} 
                title={selectedModule.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="w-full h-[500px]"
              ></iframe>
            </div>
          )}
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 prose max-w-none">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Coach Analysis</h3>
            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{selectedModule.content}</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-8">
          <header className="mb-10 text-center relative">
            <h1 className="text-4xl font-black text-slate-800 mb-4">The Learning Hub</h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg mb-6">
              Master the technical and psychological aspects of your sport with breakdowns from professional coaches.
            </p>
            {role === 'ADMIN' && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition"
              >
                + Create New Module
              </button>
            )}
          </header>

          {/* Creation Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Create Learning Module</h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                </div>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-1">Title</label>
                      <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-1">Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded">
                        <option value="TECHNICAL">Technical Analysis</option>
                        <option value="PSYCHOLOGICAL">Psychological Analysis</option>
                        <option value="NUTRITION">Nutrition & Diet</option>
                        <option value="FITNESS">Fitness & Conditioning</option>
                        <option value="GENERAL">General Insights</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-1">Sport (Optional)</label>
                      <select value={formData.sport} onChange={e => setFormData({...formData, sport: e.target.value})} className="w-full px-3 py-2 border rounded">
                        <option value="">-- General / Cross-Sport --</option>
                        {sportsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-1">YouTube URL (Optional)</label>
                      <input type="url" value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="https://www.youtube.com/watch?v=..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Short Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required rows="2" className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Detailed Content (Markdown supported)</label>
                    <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required rows="6" className="w-full px-3 py-2 border rounded" />
                  </div>
                  <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition">Publish Module</button>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map(mod => (
              <div 
                key={mod.id} 
                onClick={() => setSelectedModule(mod)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition cursor-pointer group"
              >
                {/* Mock Thumbnail if no video, otherwise a YouTube thumbnail */}
                <div className="h-48 bg-slate-200 relative">
                  {mod.video_url && getYoutubeVideoId(mod.video_url) ? (
                    <img 
                      src={`https://img.youtube.com/vi/${getYoutubeVideoId(mod.video_url)}/hqdefault.jpg`} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 font-bold">No Video</div>
                  )}
                  <div className="absolute top-4 left-4 bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded">
                    {mod.category}
                  </div>
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">{mod.title}</h2>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{mod.description}</p>
                  
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
                    <span>{mod.sport_name || 'General'}</span>
                    <span>{mod.author_name ? `By ${mod.author_name}` : 'Platform'}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {modules.length === 0 && (
              <div className="col-span-3 text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-bold">No learning modules available yet. Check back later!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
