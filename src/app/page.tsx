"use client";

import { useState } from "react";
import Link from "next/link";

interface Comment {
  id: number;
  topic_id: number;
  author: string;
  body: string;
  created_at: string;
}

interface TopicWithComments {
  id: number;
  name: string;
  topic_title: string;
  question_1_response: string;
  question_2_response: string;
  question_3_response: string;
  upvotes: number;
  created_at: string;
  comments: Comment[];
}

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

  // Submissions view state
  const [view, setView] = useState<"submit" | "submissions">("submit");
  const [topics, setTopics] = useState<TopicWithComments[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  function handleTopicBlur() {
    if (topicTitle.trim().length > 0) {
      setShowFollowUp(true);
    }
  }

  async function fetchTopics() {
    setLoadingTopics(true);
    try {
      const res = await fetch("/api/topics");
      const data = await res.json();
      setTopics(data.topics || []);
    } catch {
      console.error("Failed to fetch topics");
    } finally {
      setLoadingTopics(false);
    }
  }

  async function handleViewSubmissions() {
    setView("submissions");
    await fetchTopics();
  }

  async function handleUpvote(topicId: number) {
    try {
      const res = await fetch("/api/topics/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topicId }),
      });
      const data = await res.json();
      if (res.ok) {
        setTopics(topics.map((t) =>
          t.id === topicId ? { ...t, upvotes: data.upvotes } : t
        ));
      }
    } catch {
      console.error("Failed to upvote");
    }
  }

  async function handleAddComment(topicId: number) {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch("/api/topics/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: topicId,
          author: commentAuthor.trim(),
          body: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTopics(topics.map((t) =>
          t.id === topicId
            ? { ...t, comments: [...t.comments, data.comment] }
            : t
        ));
        setCommentText("");
        setCommentAuthor("");
      }
    } catch {
      console.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
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
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAddAnother}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Add Another Topic
            </button>
            <button
              onClick={handleViewSubmissions}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              See Current Submissions
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Submissions view
  if (view === "submissions") {
    return (
      <main className="min-h-screen py-8 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Current Submissions</h1>
              <p className="text-gray-500 text-sm mt-1">
                {topics.length} topic{topics.length !== 1 ? "s" : ""} submitted so far
              </p>
            </div>
            <button
              onClick={() => setView("submit")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Submit a Topic
            </button>
          </div>

          {loadingTopics ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="animate-spin h-6 w-6 mx-auto mb-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading…
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
              <p className="text-gray-500 font-medium">No topics submitted yet.</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to submit a topic!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.map((topic) => (
                <div key={topic.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-start gap-4">
                    {/* Upvote button */}
                    <button
                      onClick={() => handleUpvote(topic.id)}
                      className="flex flex-col items-center gap-0.5 pt-0.5 group"
                      title="I have the same thought"
                    >
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-600 group-hover:text-indigo-600 transition-colors">
                        {topic.upvotes || 0}
                      </span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{topic.topic_title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {topic.name && <span className="text-gray-500">{topic.name} &middot; </span>}
                        {new Date(topic.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>

                      {(topic.question_1_response || topic.question_2_response || topic.question_3_response) && (
                        <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                          {topic.question_1_response && (
                            <p><span className="font-medium text-gray-700">Incident/Pattern:</span> {topic.question_1_response}</p>
                          )}
                          {topic.question_2_response && (
                            <p><span className="font-medium text-gray-700">Impact:</span> {topic.question_2_response}</p>
                          )}
                          {topic.question_3_response && (
                            <p><span className="font-medium text-gray-700">Ideal Solution:</span> {topic.question_3_response}</p>
                          )}
                        </div>
                      )}

                      {/* Comments section */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setExpandedTopic(expandedTopic === topic.id ? null : topic.id);
                            setCommentText("");
                            setCommentAuthor("");
                          }}
                          className="text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium"
                        >
                          {topic.comments.length > 0
                            ? `${topic.comments.length} comment${topic.comments.length !== 1 ? "s" : ""}`
                            : "Add a comment"}
                        </button>

                        {expandedTopic === topic.id && (
                          <div className="mt-3 space-y-3">
                            {/* Existing comments */}
                            {topic.comments.map((c) => (
                              <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                                <p className="text-gray-800">{c.body}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {c.author && <span className="text-gray-500">{c.author} &middot; </span>}
                                  {new Date(c.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            ))}

                            {/* New comment form */}
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={commentAuthor}
                                onChange={(e) => setCommentAuthor(e.target.value)}
                                placeholder="Your name (optional)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  placeholder="Add a comment…"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && commentText.trim()) {
                                      handleAddComment(topic.id);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleAddComment(topic.id)}
                                  disabled={!commentText.trim() || submittingComment}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Post
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-6 px-1">
            <p className="text-xs text-gray-400">
              Click the arrow to +1 a topic you agree with.
            </p>
            <Link
              href="/admin/login"
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0 ml-4"
            >
              Admin
            </Link>
          </div>
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

        <div className="flex items-center justify-between mt-6 px-1">
          <button
            onClick={handleViewSubmissions}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            See Current Submissions
          </button>
          <Link
            href="/admin/login"
            className="text-xs text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0 ml-4"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
