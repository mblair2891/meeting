"use client";

import { useState } from "react";

export default function SubmitPage() {
  const [name, setName] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleTopicBlur() {
    if (topicTitle.trim().length > 0) {
      setShowFollowUp(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topicTitle.trim()) {
      setError("Please enter a topic title.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          topic_title: topicTitle.trim(),
          question_1_response: q1.trim(),
          question_2_response: q2.trim(),
          question_3_response: q3.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleAddAnother() {
    setName("");
    setTopicTitle("");
    setShowFollowUp(false);
    setQ1("");
    setQ2("");
    setQ3("");
    setSubmitted(false);
    setError("");
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Topic Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your topic has been added to the agenda. Thank you for your input!
          </p>
          <button
            onClick={handleAddAnother}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Add Another Topic
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meeting Agenda</h1>
          <p className="text-gray-600">
            Submit a topic you&apos;d like to discuss at our next meeting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
              Topic Title <span className="text-red-500">*</span>
            </label>
            <input
              id="topic"
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              onBlur={handleTopicBlur}
              placeholder="e.g. Weekend scheduling, inventory issues…"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              required
            />
          </div>

          {showFollowUp && (
            <div className="space-y-5 pt-2 border-t border-gray-100">
              <p className="text-sm text-indigo-600 font-medium pt-3">
                Great topic! A few follow-up questions to help us prepare:
              </p>

              <div>
                <label htmlFor="q1" className="block text-sm font-medium text-gray-700 mb-1">
                  Can you describe the specific incident or pattern?
                </label>
                <textarea
                  id="q1"
                  value={q1}
                  onChange={(e) => setQ1(e.target.value)}
                  rows={3}
                  placeholder="Tell us more about what's been happening…"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
                />
              </div>

              <div>
                <label htmlFor="q2" className="block text-sm font-medium text-gray-700 mb-1">
                  How is this affecting staff/customers?
                </label>
                <textarea
                  id="q2"
                  value={q2}
                  onChange={(e) => setQ2(e.target.value)}
                  rows={3}
                  placeholder="Describe the impact…"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
                />
              </div>

              <div>
                <label htmlFor="q3" className="block text-sm font-medium text-gray-700 mb-1">
                  What would an ideal solution look like?
                </label>
                <textarea
                  id="q3"
                  value={q3}
                  onChange={(e) => setQ3(e.target.value)}
                  rows={3}
                  placeholder="What outcome would you like to see?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting…
              </span>
            ) : (
              "Submit Topic"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          All submissions are anonymous unless you choose to include your name.
        </p>
      </div>
    </main>
  );
}
