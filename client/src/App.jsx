import React, { useState, useEffect, useMemo } from "react";
import {
  Film, Tv, Calendar, Trash2, Search, Plus, X, Pencil, Filter, BarChart3, PlayCircle, CheckCircle2, XCircle, ChevronDown, Lock
} from "lucide-react";

// Production mein relative path use karega, Local mein localhost
const API_URL = import.meta.env.PROD ? "/api" : "http://localhost:3001/api";

// --- CONSTANTS (RATINGS & CONFIG) Same as before ---
const RATINGS = {
  SKIP: { label: "SKIP", badge: "text-red-400 border-red-900/50 bg-red-900/20", text: "text-red-400" },
  TIMEPASS: { label: "TIMEPASS", badge: "text-stone-400 border-stone-700 bg-stone-800", text: "text-stone-400" },
  GO_FOR_IT: { label: "GO FOR IT", badge: "text-blue-400 border-blue-900/50 bg-blue-900/20", text: "text-blue-400" },
  LISAN_AL_GAIB: { label: "LISAN AL GAIB", badge: "text-amber-400 border-amber-900/50 bg-amber-900/20", text: "text-amber-400" },
};

const STATUS_CONFIG = {
  WATCHING: { label: "Watching", icon: PlayCircle, color: "text-emerald-400" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, color: "text-stone-400" },
  DROPPED: { label: "Dropped", icon: XCircle, color: "text-red-400" },
};

export default function App() {
  // Auth State
  const [password, setPassword] = useState(localStorage.getItem("media_log_password") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  // App State
  const [logs, setLogs] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    year: "ALL", type: "ALL", rating: "ALL", status: "ALL",
  });

  const [formData, setFormData] = useState({
      title: "", type: "MOVIE", release_year: "", rating: "GO_FOR_IT", status: "COMPLETED",
      date_watched: new Date().toISOString().split("T")[0], is_rewatch: false,
      season: "", episode: "", total_episodes: "", notes: "",
  });

  // --- AUTH HELPER ---
  const getHeaders = () => ({
    "Content-Type": "application/json",
    "x-access-token": password
  });

  // --- DATA FETCHING ---
  const fetchLogs = async (query = "") => {
    if (!password) return;
    const endpoint = query ? `/search?q=${query}` : "/logs";
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { headers: getHeaders() });
      if (res.status === 403) {
        setIsAuthenticated(false);
        setAuthError("Incorrect Password");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setIsAuthenticated(true);
        setAuthError("");
        localStorage.setItem("media_log_password", password);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  // Try to fetch on load if password exists
  useEffect(() => {
    if (password) fetchLogs(search);
  }, [search]); // Removed 'password' dependency to avoid loop, manual login triggers fetch

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-surface border border-stone-700 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-600">
            <Lock className="w-8 h-8 text-stone-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Private Access</h1>
          <p className="text-stone-400 text-sm mb-6">Enter your secret code to access logs.</p>
          <form onSubmit={(e) => { e.preventDefault(); fetchLogs(); }}>
            <input 
              type="password" 
              placeholder="Enter Password" 
              className="w-full bg-stone-900 border border-stone-600 rounded-lg p-3 text-white mb-4 outline-none focus:border-emerald-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {authError && <p className="text-red-400 text-xs mb-4">{authError}</p>}
            <button type="submit" className="w-full bg-stone-100 hover:bg-white text-stone-900 font-bold py-3 rounded-lg transition-colors">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- REST OF THE APP LOGIC (Copied from your file but using getHeaders()) ---
  
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const d = new Date(log.date_watched);
      const now = new Date();
      if (dateRange === 'THIS_MONTH') if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      if (dateRange === 'LAST_MONTH') {
        const lastMonth = new Date(); lastMonth.setMonth(now.getMonth() - 1);
        if (d.getMonth() !== lastMonth.getMonth() || d.getFullYear() !== lastMonth.getFullYear()) return false;
      }
      if (viewMode === 'ONGOING' && log.status !== 'WATCHING') return false;
      if (filters.year !== "ALL" && String(log.release_year) !== filters.year) return false;
      if (filters.type !== "ALL" && log.type !== filters.type) return false;
      if (filters.rating !== "ALL" && log.rating !== filters.rating) return false;
      if (filters.status !== "ALL" && (log.status || 'COMPLETED') !== filters.status) return false;
      return true;
    }).sort((a, b) => {
       // Sorting logic same as yours
       const priority = { WATCHING: 3, COMPLETED: 2, DROPPED: 1 };
       const weightA = priority[a.status] || 2;
       const weightB = priority[b.status] || 2;
       if (weightA !== weightB) return weightB - weightA;
       if (a.status === 'WATCHING') {
         const progA = (a.episode && a.total_episodes) ? (a.episode / a.total_episodes) : 0;
         const progB = (b.episode && b.total_episodes) ? (b.episode / b.total_episodes) : 0;
         if (Math.abs(progA - progB) > 0.01) return progB - progA;
       }
       return new Date(b.date_watched).getTime() - new Date(a.date_watched).getTime();
    });
  }, [logs, filters, viewMode, dateRange]);

  // Insights & Years
  const insights = {
    total: filteredLogs.length,
    movies: filteredLogs.filter((l) => l.type === "MOVIE").length,
    series: filteredLogs.filter((l) => l.type === "SERIES").length,
  };
  const availableYears = [...new Set(logs.map((l) => l.release_year).filter(Boolean))].sort().reverse();

  // Handlers
  const handleDelete = async (id) => {
    if (!confirm("Forget this memory?")) return;
    try { await fetch(`${API_URL}/logs/${id}`, { method: "DELETE", headers: getHeaders() }); fetchLogs(); } 
    catch (error) { alert("Network Error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalStatus = formData.status;
    let ep = parseInt(formData.episode) || 0;
    const total = parseInt(formData.total_episodes) || 0;

    // Logic for auto-completing
    if (finalStatus !== "DROPPED" && total > 0) {
      if (ep === total) finalStatus = "COMPLETED";
      else if (ep < total) {
         if (finalStatus === "COMPLETED") {
            const originalLog = logs.find((l) => l.id === editingId);
            const isStatusChange = originalLog ? originalLog.status !== "COMPLETED" : true;
            if (ep === 0 || isStatusChange) ep = total;
            else finalStatus = "WATCHING";
         }
      }
    }

    const payload = { ...formData, status: finalStatus, episode: ep };
    const url = editingId ? `${API_URL}/logs/${editingId}` : `${API_URL}/logs`;
    const method = editingId ? "PUT" : "POST";
    
    try {
      await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
      setIsFormOpen(false); setEditingId(null); 
      setFormData({ title: "", type: "MOVIE", release_year: "", rating: "GO_FOR_IT", status: "COMPLETED", date_watched: new Date().toISOString().split("T")[0], is_rewatch: false, season: "", episode: "", total_episodes: "", notes: "" });
      fetchLogs();
    } catch (error) { alert("Error saving"); }
  };

  // Helper to open edit form
  const handleEdit = (log) => {
    setEditingId(log.id);
    setFormData({ ...log, is_rewatch: !!log.is_rewatch });
    setIsFormOpen(true);
  };

  // --- RENDER (Simplified for brevity, insert your JSX here) ---
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto pb-20">
      {/* Header & Controls (Same as your code) */}
      <header className="mb-6 md:mb-8">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-stone-100">Watch Log</h1>
            <button onClick={() => { localStorage.removeItem("media_log_password"); setIsAuthenticated(false); }} className="text-xs text-stone-500 hover:text-red-400">Logout</button>
         </div>
         {/* ... Insert rest of your header/search/filter JSX here ... */}
         {/* Use handleEdit, handleDelete, handleSubmit, etc. */}
         
         {/* Temp simplified view for copy-paste checking */}
         <div className="flex gap-4 mb-4">
             <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-stone-900 text-white p-2 rounded border border-stone-700"/>
             <button onClick={() => setIsFormOpen(true)} className="bg-stone-100 text-black px-4 rounded font-bold">Add Log</button>
         </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLogs.map(log => (
            <article key={log.id} className="bg-surface rounded-xl border border-stone-700 p-5">
                <div className="flex justify-between">
                    <h3 className="font-bold text-stone-200">{log.title}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => handleEdit(log)}><Pencil className="w-4 h-4 text-stone-500"/></button>
                        <button onClick={() => handleDelete(log.id)}><Trash2 className="w-4 h-4 text-stone-500"/></button>
                    </div>
                </div>
                <div className="text-xs text-stone-400 mt-2">{log.rating} • {log.status}</div>
            </article>
        ))}
      </div>

      {/* Modal Form (Insert your Modal JSX here, connected to handleSubmit) */}
      {isFormOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-surface border border-stone-700 p-6 rounded-lg w-full max-w-lg">
                  <h2 className="text-white font-bold mb-4">{editingId ? 'Edit' : 'New'}</h2>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                      <input placeholder="Title" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="bg-stone-900 text-white p-2 rounded border border-stone-700"/>
                      {/* Add other inputs matching your state */}
                      <div className="flex gap-2 mt-2">
                        <button type="submit" className="flex-1 bg-stone-100 p-2 rounded font-bold">Save</button>
                        <button type="button" onClick={()=>setIsFormOpen(false)} className="flex-1 bg-stone-800 text-white p-2 rounded">Cancel</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}