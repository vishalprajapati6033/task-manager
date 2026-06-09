"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  CheckSquare, LogOut, Plus, ListTodo, 
  UserCheck, Send, CheckCircle2, Circle, Clock, Mail
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  created_by: string;
  assigned_to: string;
  created_at: string;
  profiles_assigned_to?: Profile;
  profiles_created_by?: Profile;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "assigned_to_me" | "created_by_me">("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
      } else {
        setUser(user);
        fetchData(user.id);
      }
    };
    checkUser();
  }, [router]);

  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Fetch profiles for assigning tasks
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("id, email, full_name");
      
      if (profileErr) throw profileErr;
      setProfiles(profileData || []);

      // 2. Fetch tasks
      // Since supabase client handles RLS, we can fetch tasks and expand foreign keys
      const { data: taskData, error: taskErr } = await supabase
        .from("tasks")
        .select(`
          *,
          profiles_assigned_to:profiles!assigned_to(id, email, full_name),
          profiles_created_by:profiles!created_by(id, email, full_name)
        `)
        .order("created_at", { ascending: false });

      if (taskErr) throw taskErr;
      setTasks(taskData || []);
    } catch (err: any) {
      console.error("Error fetching data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo) return;

    setSubmitting(true);
    try {
      const selectedProfile = profiles.find(p => p.id === assignedTo);
      const payload = {
        title,
        description,
        assigned_to: assignedTo,
        assigned_email: selectedProfile?.email,
        created_by: user.id
      };

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Call our Flask backend API
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to create task via API");

      // Reset form and refresh data
      setTitle("");
      setDescription("");
      setAssignedTo("");
      await fetchData(user.id);
    } catch (err: any) {
      alert("Error creating task: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === "pending" ? "completed" : "pending";
    try {
      const payload = {
        status: nextStatus,
        creator_email: task.profiles_created_by?.email || user.email,
        title: task.title
      };

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Call Flask Backend API
      const res = await fetch(`${API_URL}/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to update task status");

      await fetchData(user.id);
    } catch (err: any) {
      alert("Error updating task: " + err.message);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === "assigned_to_me") return task.assigned_to === user?.id;
    if (activeTab === "created_by_me") return task.created_by === user?.id;
    return true;
  });

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-indigo-500" />
          <span className="font-bold tracking-wider text-sm bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">TASKFLOW AI</span>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm text-slate-400">
              Logged in as <span className="text-white font-medium">{user.email}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm px-4 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creation Form Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              Create New Task
            </h2>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design homepage layout"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe the task details..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Assign To
                </label>
                <select
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="" disabled>Select team member</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.email} {profile.id === user?.id ? "(Me)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 hover:shadow-indigo-500/20 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Create & Assign
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Tasks List Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tabs Navigation */}
          <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-900 max-w-md">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "all" 
                  ? "bg-slate-850 text-indigo-400 shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setActiveTab("assigned_to_me")}
              className={`flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "assigned_to_me" 
                  ? "bg-slate-850 text-indigo-400 shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Assigned To Me
            </button>
            <button
              onClick={() => setActiveTab("created_by_me")}
              className={`flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "created_by_me" 
                  ? "bg-slate-850 text-indigo-400 shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Created By Me
            </button>
          </div>

          {/* Tasks Loading State */}
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/20 border border-slate-900/50 rounded-2xl">
              <ListTodo className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No tasks found</p>
              <p className="text-slate-600 text-xs mt-1">Create a new task to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    task.status === "completed" 
                      ? "bg-slate-950/40 border-slate-900/80 opacity-70" 
                      : "bg-slate-900/40 border-slate-850 hover:border-slate-800"
                  }`}
                >
                  {/* Task details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <button 
                        onClick={() => handleToggleStatus(task)}
                        className="text-slate-400 hover:text-indigo-400 transition-colors"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600 hover:border-indigo-400" />
                        )}
                      </button>
                      <h3 className={`font-semibold text-base ${task.status === "completed" ? "line-through text-slate-500" : "text-white"}`}>
                        {task.title}
                      </h3>
                    </div>
                    {task.description && (
                      <p className="text-slate-400 text-sm ml-7">
                        {task.description}
                      </p>
                    )}
                    
                    {/* Meta tags */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 ml-7 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        Assignee: {task.profiles_assigned_to?.email || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Creator: {task.profiles_created_by?.email || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Status indicator on desktop */}
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      task.status === "completed" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
