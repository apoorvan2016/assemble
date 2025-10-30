import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Users, FolderOpen, Calendar, Shield, Activity, CheckCircle, XCircle, FileText, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

interface Stats {
  users: { total: number; active: number };
  projects: { total: number; active: number; reports: number };
  hackathons: { total: number; active: number; reports: number };
  research_papers: { total: number; active: number; reports: number };
  reports: { total: number; pending: number };
}

interface Project {
  id: number;
  name: string;
  description: string;
  owner: {
    id: number;
    username: string;
    email: string;
  };
  created_at: string;
  application_count: number;
  is_active: boolean;
}

interface Hackathon {
  id: number;
  title: string;
  description: string;
  hackathon_name: string;
  owner: {
    id: number;
    username: string;
    email: string;
  };
  created_at: string;
  application_count: number;
  is_active: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  project_count: number;
  hackathon_count: number;
}

interface ResearchPaper {
  id: number;
  title: string;
  abstract: string;
  authors: string;
  category: string;
  status: string;
  is_active: boolean;
  owner: {
    id: number;
    username: string;
    email: string;
  };
  created_at: string;
  report_count: number;
}

interface Report {
  id: number;
  report_type: string;
  target_id: number;
  target_info: {
    name: string;
    owner: string;
  };
  reason: string;
  status: string;
  reporter: {
    id: number;
    username: string;
  };
  created_at: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'hackathons' | 'research_papers' | 'reports' | 'users'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!user?.is_admin) {
      toast.error('Admin access required');
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, projectsRes, hackathonsRes, usersRes, papersRes, reportsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/projects'),
        api.get('/admin/hackathons'),
        api.get('/admin/users'),
        api.get('/admin/research-papers'),
        api.get('/admin/reports')
      ]);

      setStats(statsRes.data);
      setProjects(projectsRes.data);
      setHackathons(hackathonsRes.data);
      setUsers(usersRes.data);
      setResearchPapers(papersRes.data);
      setReports(reportsRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.delete(`/admin/projects/${projectId}`);
      toast.success('Project deleted successfully');
      setProjects(projects.filter(p => p.id !== projectId));
      loadData();
    } catch (error) {
      toast.error('Failed to delete project');
      console.error(error);
    }
  };

  const handleDeleteHackathon = async (hackathonId: number) => {
    if (!confirm('Are you sure you want to delete this hackathon post?')) return;

    try {
      await api.delete(`/admin/hackathons/${hackathonId}`);
      toast.success('Hackathon deleted successfully');
      setHackathons(hackathons.filter(h => h.id !== hackathonId));
      loadData();
    } catch (error) {
      toast.error('Failed to delete hackathon');
      console.error(error);
    }
  };

  const handleToggleUserActive = async (userId: number) => {
    try {
      const response = await api.put(`/admin/users/${userId}/toggle-active`);
      toast.success(response.data.message);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_active: response.data.is_active } : u
      ));
    } catch (error) {
      toast.error('Failed to update user status');
      console.error(error);
    }
  };

  const handleDeleteResearchPaper = async (paperId: number) => {
    if (!confirm('Are you sure you want to delete this research paper?')) return;

    try {
      await api.delete(`/admin/research-papers/${paperId}`);
      toast.success('Research paper deleted successfully');
      setResearchPapers(researchPapers.filter(p => p.id !== paperId));
      loadData();
    } catch (error) {
      toast.error('Failed to delete research paper');
      console.error(error);
    }
  };

  const handleUpdateReportStatus = async (reportId: number, status: string) => {
    try {
      await api.put(`/admin/reports/${reportId}/status`, { status });
      toast.success('Report status updated successfully');
      setReports(reports.map(r =>
        r.id === reportId ? { ...r, status } : r
      ));
    } catch (error) {
      toast.error('Failed to update report status');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-600">Manage platform content and users</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="h-4 w-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'projects'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FolderOpen className="h-4 w-4 inline mr-2" />
                Projects ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab('hackathons')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'hackathons'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Hackathons ({hackathons.length})
              </button>
              <button
                onClick={() => setActiveTab('research_papers')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'research_papers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Papers ({researchPapers.length})
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'reports'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Reports ({reports.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Users ({users.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Users</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-900 mb-1">{stats.users.total}</div>
                  <p className="text-sm text-blue-700">{stats.users.active} active</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <FolderOpen className="h-8 w-8 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Projects</span>
                  </div>
                  <div className="text-3xl font-bold text-green-900 mb-1">{stats.projects.total}</div>
                  <p className="text-sm text-green-700">{stats.projects.active} active</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-8 w-8 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Hackathons</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-900 mb-1">{stats.hackathons.total}</div>
                  <p className="text-sm text-orange-700">{stats.hackathons.active} active</p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6 border border-teal-200">
                  <div className="flex items-center justify-between mb-4">
                    <FileText className="h-8 w-8 text-teal-600" />
                    <span className="text-sm font-medium text-teal-700">Research Papers</span>
                  </div>
                  <div className="text-3xl font-bold text-teal-900 mb-1">{stats.research_papers.total}</div>
                  <p className="text-sm text-teal-700">{stats.research_papers.active} active</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Reports</span>
                  </div>
                  <div className="text-3xl font-bold text-red-900 mb-1">{stats.reports.total}</div>
                  <p className="text-sm text-red-700">{stats.reports.pending} pending</p>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No projects found</p>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>By: {project.owner.username}</span>
                            <span>•</span>
                            <span>{project.application_count} applications</span>
                            <span>•</span>
                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'hackathons' && (
              <div className="space-y-4">
                {hackathons.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hackathons found</p>
                ) : (
                  hackathons.map((hackathon) => (
                    <div key={hackathon.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{hackathon.title}</h3>
                          <p className="text-sm text-orange-600 font-medium mb-2">{hackathon.hackathon_name}</p>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{hackathon.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>By: {hackathon.owner.username}</span>
                            <span>•</span>
                            <span>{hackathon.application_count} applications</span>
                            <span>•</span>
                            <span>{new Date(hackathon.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteHackathon(hackathon.id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete hackathon"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'research_papers' && (
              <div className="space-y-4">
                {researchPapers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No research papers found</p>
                ) : (
                  researchPapers.map((paper) => (
                    <div key={paper.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{paper.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{paper.authors}</p>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{paper.abstract}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>By: {paper.owner.username}</span>
                            <span>•</span>
                            <span className={`px-2 py-1 rounded ${
                              paper.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {paper.status}
                            </span>
                            {paper.report_count > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-red-600 font-medium">{paper.report_count} reports</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(paper.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteResearchPaper(paper.id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete research paper"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No reports found</p>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              report.report_type === 'project' ? 'bg-green-100 text-green-800' :
                              report.report_type === 'hackathon' ? 'bg-orange-100 text-orange-800' :
                              'bg-teal-100 text-teal-800'
                            }`}>
                              {report.report_type.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {report.target_info?.name || `${report.report_type} #${report.target_id}`}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Reason:</span> {report.reason}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Reporter: {report.reporter.username}</span>
                            {report.target_info?.owner && (
                              <>
                                <span>•</span>
                                <span>Owner: {report.target_info.owner}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          {report.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                              className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors"
                            >
                              Mark Reviewed
                            </button>
                          )}
                          {report.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                              className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{userItem.username}</div>
                          <div className="text-sm text-gray-500">{userItem.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userItem.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userItem.project_count} projects, {userItem.hackathon_count} hackathons
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userItem.is_admin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </span>
                          ) : userItem.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!userItem.is_admin && (
                            <button
                              onClick={() => handleToggleUserActive(userItem.id)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                userItem.is_active
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {userItem.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
