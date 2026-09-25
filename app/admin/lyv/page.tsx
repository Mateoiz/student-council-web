"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Eye, X, Mail, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

// Types
type Application = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  college: string;
  program: string;
  year_level: string;
  committee: string;
  description: string;
};

type SortKey = "name" | "college" | "committee" | "created_at";
type SortDirection = "asc" | "desc";

// UI Helpers
const formatCommittee = (id: string) => {
  const map: Record<string, string> = {
    "logistics": "Logistics",
    "comms": "Comms & Secretariat",
    "operations": "Operations (Martial & Tech)",
    "multimedia-creatives": "MM: Creatives",
    "multimedia-documentation": "MM: Documentation",
  };
  return map[id] || id;
};

const getCollegeStyle = (college: string) => {
  switch (college) {
    case "CAST": return "bg-red-50 text-red-700 border-red-200";
    case "CBMA": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "COED": return "bg-purple-50 text-purple-700 border-purple-200";
    case "CVMAS": return "bg-green-50 text-green-700 border-green-200";
    default: return "bg-zinc-50 text-zinc-700 border-zinc-200";
  }
};

const COLLEGES = ["All", "CAST", "CBMA", "COED", "CVMAS"];
const COMMITTEES = [
  { id: "All", label: "All Committees" },
  { id: "logistics", label: "Logistics" },
  { id: "comms", label: "Comms & Secretariat" },
  { id: "operations", label: "Operations" },
  { id: "multimedia-creatives", label: "MM: Creatives" },
  { id: "multimedia-documentation", label: "MM: Documentation" },
];

export default function LYVDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  
  // Filtering & Sorting State
  const [filterCollege, setFilterCollege] = useState<string>("All");
  const [filterCommittee, setFilterCommittee] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  
  // Modal State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("lyv_applications")
        .select("*");

      if (error) {
        console.error("Error fetching applications:", error);
      } else {
        setApplications(data || []);
      }
      
      setLoading(false);
    };

    init();
  }, [router]);

  // Handle Column Sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={14} className="text-zinc-300" />;
    return sortDir === "asc" ? <ArrowUp size={14} className="text-zinc-900" /> : <ArrowDown size={14} className="text-zinc-900" />;
  };

  // 1. Filter Data
  let processedApps = applications.filter(app => {
    const matchCollege = filterCollege === "All" || app.college === filterCollege;
    const matchCommittee = filterCommittee === "All" || app.committee === filterCommittee;
    return matchCollege && matchCommittee;
  });

  // 2. Sort Data
  processedApps = processedApps.sort((a, b) => {
    let valA = a[sortKey].toLowerCase();
    let valB = b[sortKey].toLowerCase();

    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 pb-20">
      <Navbar />

      <div className="pt-28 px-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <Link href="/admin" className="inline-flex items-center text-sm font-semibold text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
              <ChevronLeft size={16} className="mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">LYV Applications</h1>
            <p className="text-zinc-500 mt-1">Review and manage volunteer intake forms.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white border border-zinc-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
              <span className="text-sm font-medium text-zinc-500">Total Applicants</span>
              <span className="text-lg font-bold text-zinc-900">{processedApps.length}</span>
            </div>
          </div>
        </div>

        {/* Improved Interactive Filters */}
        <div className="mb-6 space-y-4">
          {/* College Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider mr-2">College:</span>
            {COLLEGES.map(college => (
              <button
                key={college}
                onClick={() => setFilterCollege(college)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  filterCollege === college 
                    ? "bg-zinc-900 text-white shadow-md" 
                    : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400"
                }`}
              >
                {college}
              </button>
            ))}
          </div>

          {/* Committee Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider mr-2">Committee:</span>
            {COMMITTEES.map(comm => (
              <button
                key={comm.id}
                onClick={() => setFilterCommittee(comm.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filterCommittee === comm.id 
                    ? "bg-green-100 text-green-800 border-green-200 shadow-sm" 
                    : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50"
                } border`}
              >
                {comm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sortable Data Table */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-widest font-semibold text-zinc-500">
                  <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 select-none" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-2">Applicant <SortIcon column="name" /></div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 select-none" onClick={() => handleSort("college")}>
                    <div className="flex items-center gap-2">College & Program <SortIcon column="college" /></div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 select-none" onClick={() => handleSort("committee")}>
                    <div className="flex items-center gap-2">Committee <SortIcon column="committee" /></div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 select-none" onClick={() => handleSort("created_at")}>
                    <div className="flex items-center gap-2">Applied <SortIcon column="created_at" /></div>
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {processedApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-medium">
                      No applications found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  processedApps.map((app) => (
                    <tr key={app.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900">{app.name}</div>
                        <a href={`mailto:${app.email}`} className="text-sm text-zinc-500 hover:text-green-600 transition-colors flex items-center gap-1 mt-0.5">
                          {app.email}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getCollegeStyle(app.college)}`}>
                            {app.college}
                          </span>
                          <span className="text-sm font-medium text-zinc-700">Year {app.year_level}</span>
                        </div>
                        <div className="text-sm text-zinc-500 truncate max-w-[200px]">{app.program}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 text-sm font-medium border border-zinc-200">
                          {formatCommittee(app.committee)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Application Details */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h3 className="text-lg font-bold">Application Details</h3>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900">{selectedApp.name}</h2>
                  <a href={`mailto:${selectedApp.email}`} className="text-zinc-500 hover:text-green-600 flex items-center gap-1.5 mt-1">
                    <Mail size={16} />
                    {selectedApp.email}
                  </a>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-md border ${getCollegeStyle(selectedApp.college)}`}>
                  {selectedApp.college}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 p-5 bg-zinc-50 rounded-xl border border-zinc-100 mb-6">
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Program</div>
                  <div className="font-medium">{selectedApp.program}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Year Level</div>
                  <div className="font-medium">{selectedApp.year_level}</div>
                </div>
                <div className="col-span-2 border-t border-zinc-200/60 pt-4 mt-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Target Committee</div>
                  <div className="font-medium">{formatCommittee(selectedApp.committee)}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Applicant Statement</div>
                <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap bg-white p-5 rounded-xl border border-zinc-200">
                  {selectedApp.description}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button 
                onClick={() => setSelectedApp(null)}
                className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-sm font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}