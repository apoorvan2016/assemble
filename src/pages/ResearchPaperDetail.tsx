import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Calendar, User, ExternalLink, Edit, Trash2, Upload } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface ResearchPaper {
  id: number;
  title: string;
  abstract: string;
  authors: string;
  category: string;
  keywords: string;
  status: string;
  paper_url: string | null;
  doi: string | null;
  publication_date: string | null;
  owner_id: number;
  owner: {
    id: number;
    username: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export default function ResearchPaperDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paper, setPaper] = useState<ResearchPaper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaper();
  }, [id]);

  const fetchPaper = async () => {
    try {
      const response = await api.get(`/research/papers/${id}`);
      setPaper(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch research paper');
      navigate('/research');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this research paper?')) return;

    try {
      await api.delete(`/research/papers/${id}`);
      toast.success('Research paper deleted successfully');
      navigate('/research');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete research paper');
    }
  };

  const handlePublish = () => {
    navigate(`/research/${id}/publish`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!paper) {
    return null;
  }

  const isOwner = user?.id === paper.owner_id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-8 h-8 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{paper.title}</h1>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      paper.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {paper.status === 'published' ? 'Published' : 'Abstract Only'}
                  </span>
                </div>
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                {paper.status === 'abstract' && (
                  <button
                    onClick={handlePublish}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                    title="Publish Paper"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Paper"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Authors</h2>
            <p className="text-gray-700">{paper.authors}</p>
          </div>

          {paper.category && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Category</h2>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                {paper.category}
              </span>
            </div>
          )}

          {paper.keywords && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {paper.keywords.split(',').map((keyword, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Abstract</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{paper.abstract}</p>
          </div>

          {paper.status === 'published' && (
            <>
              {paper.paper_url && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Full Paper</h2>
                  <a
                    href={paper.paper_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Full Paper
                  </a>
                </div>
              )}

              {paper.doi && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">DOI</h2>
                  <p className="text-gray-700 font-mono">{paper.doi}</p>
                </div>
              )}

              {paper.publication_date && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Publication Date</h2>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(paper.publication_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Submitted By</h2>
            <div className="flex items-center gap-3">
              {paper.owner.avatar_url ? (
                <img
                  src={paper.owner.avatar_url}
                  alt={paper.owner.full_name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-semibold">
                  {paper.owner.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{paper.owner.full_name}</p>
                <p className="text-sm text-gray-500">@{paper.owner.username}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p>Submitted on {new Date(paper.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
            {paper.updated_at !== paper.created_at && (
              <p className="mt-1">Last updated {new Date(paper.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
