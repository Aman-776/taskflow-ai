"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Types
type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  project_id: string;
};

type Project = {
  id: string;
  title: string;
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  // Fetch projects on load
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch tasks when a project is selected
  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    const { data, error } = await supabase.from("projects").select("*");
    if (!error && data) {
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    }
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", selectedProject)
      .order("position", { ascending: true });
    if (!error && data) setTasks(data);
  };

  const addTask = async (status: Task["status"]) => {
    if (!newTaskTitle.trim()) return;
    await supabase.from("tasks").insert([
      { title: newTaskTitle, status, project_id: selectedProject },
    ]);
    setNewTaskTitle("");
    fetchTasks();
  };

  const moveTask = async (id: string, newStatus: Task["status"]) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
    fetchTasks();
  };

  const generateSummary = async () => {
    setLoadingAI(true);
    setAiSummary("");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch (err) {
      setAiSummary("Failed to generate summary.");
    }
    setLoadingAI(false);
  };

  const columns: { title: string; status: Task["status"] }[] = [
    { title: "To Do", status: "todo" },
    { title: "In Progress", status: "in_progress" },
    { title: "Done", status: "done" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold">TaskFlow AI</h1>
          <p className="text-gray-400 mt-1">Manage projects with a hint of AI.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            onClick={generateSummary}
            disabled={loadingAI}
            className="bg-[#00ff88] text-black font-bold px-4 py-2 rounded hover:bg-[#00cc6a] disabled:opacity-50"
          >
            {loadingAI ? "Thinking..." : "AI Summary"}
          </button>
        </div>
      </div>

      {/* AI Summary Box */}
      {aiSummary && (
        <div className="mb-8 p-4 bg-gray-900 border border-[#00ff88]/30 rounded-lg text-gray-300 text-sm">
          <span className="text-[#00ff88] font-bold">AI Insight:</span> {aiSummary}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <h2 className="font-bold mb-4 text-gray-400">{col.title}</h2>
              
              {/* Add Task Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#00ff88]"
                />
                <button
                  onClick={() => addTask(col.status)}
                  className="text-[#00ff88] font-bold text-xl"
                >
                  +
                </button>
              </div>

              {/* Task Cards */}
              <div className="space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-black border border-gray-800 p-3 rounded shadow-sm hover:border-gray-600 transition-colors"
                  >
                    <p className="text-sm mb-2">{task.title}</p>
                    <div className="flex gap-2">
                      {columns
                        .filter((c) => c.status !== task.status)
                        .map((c) => (
                          <button
                            key={c.status}
                            onClick={() => moveTask(task.id, c.status)}
                            className="text-[10px] text-gray-500 hover:text-[#00ff88] border border-gray-800 px-2 py-0.5 rounded"
                          >
                            {c.title}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}