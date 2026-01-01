import React, { useState, useEffect } from "react";
import {
    Film,
    Tv,
    Calendar,
    Trash2,
    Repeat,
    Search,
    Plus,
    X,
    Pencil,
} from "lucide-react";

// KEEP YOUR IP HERE
const API_URL = "http://192.168.1.5:3001/api";

// Rating Config - Keys match DB, Labels are clean
const RATINGS = {
    SKIP: {
        label: "SKIP",
        color: "text-red-400 border-red-900/50 bg-red-900/20",
    },
    TIMEPASS: {
        label: "TIMEPASS",
        color: "text-stone-400 border-stone-700 bg-stone-800",
    },
    GO_FOR_IT: {
        label: "GO FOR IT",
        color: "text-blue-400 border-blue-900/50 bg-blue-900/20",
    },
    LISAN_AL_GAIB: {
        label: "LISAN AL GAIB",
        color: "text-amber-400 border-amber-900/50 bg-amber-900/20",
    },
};

export default function App() {
    const [logs, setLogs] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null); // Track if editing
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        type: "MOVIE",
        release_year: "",
        rating: "GO_FOR_IT",
        date_watched: new Date().toISOString().split("T")[0],
        is_rewatch: false,
        season: "",
        episode: "",
        notes: "",
    });

    const fetchLogs = async (query = "") => {
        const endpoint = query ? `/search?q=${query}` : "/logs";
        try {
            const res = await fetch(`${API_URL}${endpoint}`);
            const data = await res.json();
            setLogs(data);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        }
    };

    useEffect(() => {
        fetchLogs(search);
    }, [search]);

    // --- MISSING FUNCTIONS RESTORED BELOW ---

    const resetForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({
            title: '', type: 'MOVIE', release_year: '', rating: 'GO_FOR_IT',
            date_watched: new Date().toISOString().split('T')[0],
            is_rewatch: false, season: '', episode: '', notes: ''
        });
    };

    const handleEdit = (log) => {
        setEditingId(log.id);
        setFormData({
            title: log.title,
            type: log.type,
            release_year: log.release_year || '',
            rating: log.rating,
            date_watched: log.date_watched,
            is_rewatch: !!log.is_rewatch,
            season: log.season || '',
            episode: log.episode || '',
            notes: log.notes || ''
        });
        setIsFormOpen(true);
    };

    // UPDATED: Robust Delete with Error Handling
    const handleDelete = async (id) => {
        if (!confirm("Forget this memory?")) return;

        try {
            const res = await fetch(`${API_URL}/logs/${id}`, { method: 'DELETE' });

            if (!res.ok) {
                const errorData = await res.json();
                alert(`Server Error: ${errorData.error || 'Failed to delete'}`);
                return;
            }
            // Success
            fetchLogs();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Network Error: Cannot reach the server. Check your Wi-Fi or IP settings.");
        }
    };

    // --- END OF RESTORED FUNCTIONS ---

    // Handle Submit (Create OR Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `${API_URL}/logs/${editingId}` : `${API_URL}/logs`;
        const method = editingId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert(`Error: ${errorData.error || "Failed to save"}`);
                return;
            }

            resetForm();
            fetchLogs();
        } catch (error) {
            console.error("Error saving log", error);
            alert("Network Error: Is the server running?");
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-stone-100">
                        Watch Log
                    </h1>
                    <p className="text-stone-500 text-sm mt-1">Personal Recall System</p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                        <input
                            type="text"
                            placeholder="Search memories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-surface text-stone-200 text-sm rounded-lg pl-9 pr-4 py-2 border border-stone-700 focus:outline-none focus:border-stone-500"
                        />
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsFormOpen(true);
                        }}
                        className="bg-stone-200 hover:bg-white text-stone-900 rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Log Entry
                    </button>
                </div>
            </header>

            {/* CARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {logs.map((log) => (
                    <article
                        key={log.id}
                        className="bg-surface rounded-xl border border-stone-700/50 p-5 shadow-lg group hover:border-stone-600 transition-all"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded border ${RATINGS[log.rating].color
                                        }`}
                                >
                                    {RATINGS[log.rating].label}
                                </span>
                                {log.is_rewatch === 1 && (
                                    <span className="text-xs text-stone-500 flex items-center gap-1">
                                        <Repeat className="w-3 h-3" /> Rewatch
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(log)}
                                    className="text-stone-600 hover:text-stone-300"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(log.id)}
                                    className="text-stone-600 hover:text-red-400"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-stone-100 leading-tight mb-1">
                            {log.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400 mb-4 uppercase tracking-wider font-medium">
                            <span className="flex items-center gap-1">
                                {log.type === "MOVIE" ? (
                                    <Film className="w-3 h-3" />
                                ) : (
                                    <Tv className="w-3 h-3" />
                                )}
                                {log.type}
                            </span>
                            {log.release_year && <span>{log.release_year}</span>}
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {log.date_watched}
                            </span>
                            {(log.season || log.episode) && (
                                <span className="text-stone-300">
                                    {log.season ? `S${log.season}` : ""}
                                    {log.episode ? `E${log.episode}` : ""}
                                </span>
                            )}
                        </div>

                        {log.notes && (
                            <p className="text-sm text-stone-300 bg-black/20 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                                {log.notes}
                            </p>
                        )}
                    </article>
                ))}
            </div>

            {logs.length === 0 && (
                <div className="text-center py-20 text-stone-600">
                    <p>No logs found. Watch something cool.</p>
                </div>
            )}

            {/* MODAL FORM */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-surface border border-stone-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? "Edit Entry" : "New Entry"}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="text-stone-500 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Title & Year */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <label className="block text-xs text-stone-400 mb-1">
                                        Title
                                    </label>
                                    <input
                                        required
                                        className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white focus:border-stone-500 outline-none"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-stone-400 mb-1">
                                        Year
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white focus:border-stone-500 outline-none"
                                        value={formData.release_year}
                                        onChange={(e) =>
                                            setFormData({ ...formData, release_year: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Type & Rating */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-stone-400 mb-1">
                                        Type
                                    </label>
                                    <select
                                        className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white outline-none"
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData({ ...formData, type: e.target.value })
                                        }
                                    >
                                        <option value="MOVIE">Movie</option>
                                        <option value="SERIES">TV Series</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-stone-400 mb-1">
                                        Rating
                                    </label>
                                    <select
                                        className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white outline-none"
                                        value={formData.rating}
                                        onChange={(e) =>
                                            setFormData({ ...formData, rating: e.target.value })
                                        }
                                    >
                                        {Object.keys(RATINGS).map((key) => (
                                            <option key={key} value={key}>
                                                {RATINGS[key].label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Series Specifics */}
                            {formData.type === "SERIES" && (
                                <div className="grid grid-cols-2 gap-4 bg-stone-900/50 p-3 rounded-lg border border-stone-800">
                                    <div>
                                        <label className="block text-xs text-stone-500 mb-1">
                                            Season (Opt)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-white outline-none"
                                            value={formData.season}
                                            onChange={(e) =>
                                                setFormData({ ...formData, season: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-stone-500 mb-1">
                                            Episode (Opt)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-white outline-none"
                                            value={formData.episode}
                                            onChange={(e) =>
                                                setFormData({ ...formData, episode: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Date & Rewatch */}
                            <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <label className="block text-xs text-stone-400 mb-1">
                                        Date Watched
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white outline-none [color-scheme:dark]"
                                        value={formData.date_watched}
                                        onChange={(e) =>
                                            setFormData({ ...formData, date_watched: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-5">
                                    <input
                                        type="checkbox"
                                        id="rewatch"
                                        className="w-4 h-4 accent-amber-500"
                                        checked={formData.is_rewatch}
                                        onChange={(e) =>
                                            setFormData({ ...formData, is_rewatch: e.target.checked })
                                        }
                                    />
                                    <label htmlFor="rewatch" className="text-sm text-stone-300">
                                        Rewatch?
                                    </label>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs text-stone-400 mb-1">
                                    Personal Notes
                                </label>
                                <textarea
                                    rows="3"
                                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-stone-500 outline-none"
                                    value={formData.notes}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                    }
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-stone-100 hover:bg-white text-stone-900 font-bold py-3 rounded-lg transition-colors mt-2"
                            >
                                {editingId ? "Update Memory" : "Save Memory"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}