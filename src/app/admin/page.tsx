"use client";

import { useState, useEffect, useCallback } from "react";

interface Topic {
  id: number;
  name: string;
  topic_title: string;
  question_1_response: string;
  question_2_response: string;
  question_3_response: string;
  category: string;
  created_at: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Topic>>({});
  const [agenda, setAgenda] = useState("");
  const [generatingAgenda, setGeneratingAgenda] = useState(false);
  const [agendaError, setAgendaError] = useState("");
  const [copied, setCopied] = useState(false);

  const authHeader = `Bearer ${password}`;

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/topics", {
        headers: { Authorization: authHeader },
      });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setTopics(data.topics || []);
    } catch {
      console.error("Failed to fetch topics");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    if (authenticated) fetchTopics();
  }, [authenticated, fetchTopics]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
      } else {
        setAuthError("Invalid password");
      }
    } catch {
      setAuthError("Connection error");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this topic?")) return;
    try {
      await fetch("/api/admin/topics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ id }),
      });
      setTopics(topics.filter((t) => t.id !== id));
    } catch {
      alert("Failed to delete topic");
    }
  }

  function startEdit(topic: Topic) {
    setEditingId(topic.id);
    setEditForm({ ...topic });
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      const res = await fetch("/api/admin/topics", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setTopics(topics.map((t) => (t.id === editingId ? { ...t, ...editForm } as Topic : t)));
        setEditingId(null);
        setEditForm({});
      }
    } catch {
      alert("Failed to save changes");
    }
  }

  async function generateAgenda() {
    setGeneratingAgenda(true);
    setAgendaError("");
    setAgenda("");
    try {
      const res = await fetch("/api/admin/generate-agenda", {
        method: "POST",
        headers: { Authorization: authHeader },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAgenda(data.agenda);
    } catch (err) {
      setAgendaError(err instanceof Error ? err.message : "Failed to generate agenda");
    } finally {
      setGeneratingAgenda(false);
    }
  }

  async function copyAgenda() {
    await navigator.clipboard.writeText(agenda);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadPdf() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Meeting Agenda</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
          h1, h2, h3 { color: #111; }
          h1 { border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }
          ul { padding-left: 20px; }
          li { margin-bottom: 4px; }
          pre { white-space: pre-wrap; font-family: inherit; }
        </style>
      </head>
      <body><pre>${agenda.replace(/</g, "&lt;")}</pre></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  const uniqueNames = [...new Set(topics.filter((t) => t.name).map((t) => t.name))];

  // Login screen
  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mb-6">Enter the admin password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none mb-3"
            autoFocus
          />
          {authError && <p className="text-red-600 text-sm mb-3">{authError}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Log In
          </button>
        </form>
      </main>
    );
  }

  // Dashboard
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              {topics.length} topic{topics.length !== 1 ? "s" : ""} submitted
              {uniqueNames.length > 0 && (
                <span> &middot; From: {uniqueNames.join(", ")}</span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchTopics}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={generateAgenda}
              disabled={generatingAgenda || topics.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {generatingAgenda ? "Generating…" : "Generate AI Agenda"}
            </button>
          </div>
        </div>

        {/* Agenda Output */}
        {(agenda || agendaError) && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Generated Agenda</h2>
              {agenda && (
                <div className="flex gap-2">
                  <button
                    onClick={copyAgenda}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy Text"}
                  </button>
                  <button
                    onClick={downloadPdf}
                    className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Download PDF
                  </button>
                </div>
              )}
            </div>
            {agendaError ? (
              <p className="text-red-600">{agendaError}</p>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                {agenda}
              </pre>
            )}
          </div>
        )}

        {/* Topics List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading topics…</div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No topics submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <div key={topic.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                {editingId === topic.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <input
                      value={editForm.topic_title || ""}
                      onChange={(e) => setEditForm({ ...editForm, topic_title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Topic title"
                    />
                    <input
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Name (optional)"
                    />
                    <textarea
                      value={editForm.question_1_response || ""}
                      onChange={(e) => setEditForm({ ...editForm, question_1_response: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      rows={2}
                      placeholder="Incident/pattern"
                    />
                    <textarea
                      value={editForm.question_2_response || ""}
                      onChange={(e) => setEditForm({ ...editForm, question_2_response: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      rows={2}
                      placeholder="Impact on staff/customers"
                    />
                    <textarea
                      value={editForm.question_3_response || ""}
                      onChange={(e) => setEditForm({ ...editForm, question_3_response: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      rows={2}
                      placeholder="Ideal solution"
                    />
                    <input
                      value={editForm.category || ""}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Category (optional)"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditForm({}); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{topic.topic_title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {topic.name && <span className="text-gray-600">{topic.name} &middot; </span>}
                          {new Date(topic.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {topic.category && (
                            <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                              {topic.category}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(topic)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(topic.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {(topic.question_1_response || topic.question_2_response || topic.question_3_response) && (
                      <div className="mt-3 space-y-2 text-sm text-gray-600">
                        {topic.question_1_response && (
                          <div>
                            <span className="font-medium text-gray-700">Incident/Pattern:</span>{" "}
                            {topic.question_1_response}
                          </div>
                        )}
                        {topic.question_2_response && (
                          <div>
                            <span className="font-medium text-gray-700">Impact:</span>{" "}
                            {topic.question_2_response}
                          </div>
                        )}
                        {topic.question_3_response && (
                          <div>
                            <span className="font-medium text-gray-700">Ideal Solution:</span>{" "}
                            {topic.question_3_response}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
