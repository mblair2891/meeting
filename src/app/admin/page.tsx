"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";

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
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Topic>>({});
  const [agenda, setAgenda] = useState("");
  const [generatingAgenda, setGeneratingAgenda] = useState(false);
  const [agendaError, setAgendaError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");

  // Check session on load
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (!data.authenticated) {
          router.replace("/admin/login");
          return;
        }
      } catch {
        router.replace("/admin/login");
        return;
      }
      setCheckingAuth(false);
    }
    checkAuth();
  }, [router]);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/topics");
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      setTopics(data.topics || []);
    } catch {
      console.error("Failed to fetch topics");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!checkingAuth) fetchTopics();
  }, [checkingAuth, fetchTopics]);

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this topic?")) return;
    try {
      await fetch("/api/admin/topics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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

  function handleGenerateClick() {
    setShowMeetingModal(true);
  }

  async function generateAgenda() {
    setShowMeetingModal(false);
    setGeneratingAgenda(true);
    setAgendaError("");
    setAgenda("");
    try {
      const res = await fetch("/api/admin/generate-agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingDate,
          meetingTime,
          meetingLocation,
        }),
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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Meeting Agenda", margin, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, margin, 33);

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(margin, 37, pageWidth - margin, 37);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(agenda, maxWidth);
    let y = 45;

    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 6;
    }

    doc.save("meeting-agenda.pdf");
  }

  const uniqueNames = [...new Set(topics.filter((t) => t.name).map((t) => t.name))];

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors bg-white"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors bg-white"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Generate Agenda CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Generate AI Agenda</h2>
              <p className="text-indigo-200 text-sm mt-1">
                Use AI to organize all {topics.length} topic{topics.length !== 1 ? "s" : ""} into a structured meeting agenda.
              </p>
            </div>
            <button
              onClick={handleGenerateClick}
              disabled={generatingAgenda || topics.length === 0}
              className="flex-shrink-0 bg-white text-indigo-700 px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {generatingAgenda ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </span>
              ) : (
                "Generate Agenda"
              )}
            </button>
          </div>
        </div>

        {/* Agenda Output */}
        {(agenda || agendaError) && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="text-xl font-bold text-gray-900">Generated Agenda</h2>
              {agenda && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={copyAgenda}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {copied ? "Copied!" : "Copy Text"}
                  </button>
                  <button
                    onClick={downloadPdf}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                  <button
                    onClick={handleGenerateClick}
                    disabled={generatingAgenda}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors font-medium disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                </div>
              )}
            </div>
            {agendaError ? (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {agendaError}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                  {agenda}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Topics List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Submitted Topics</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading topics…
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 font-medium">No topics submitted yet.</p>
            <p className="text-gray-400 text-sm mt-1">Share the submission form link with your team.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <div key={topic.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                {editingId === topic.id ? (
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

      {/* Meeting Details Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Meeting Details</h3>
            <p className="text-sm text-gray-500 mb-5">Enter the meeting info to include in the agenda.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="e.g. Conference Room A, Zoom, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMeetingModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateAgenda}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
