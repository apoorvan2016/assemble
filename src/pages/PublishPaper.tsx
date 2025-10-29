import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, ExternalLink } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface ResearchPaper {
  id: number;
  title: string;
  abstract: string;
  status: string;
}

export default function PublishPaper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paper, setPaper] = useState<ResearchPaper | null>(null);
  const [formData, setFormData] = useState({
    paper_url: '',
    doi: ''
  });

  useEffect(() => {
    fetchPaper();
  }, [id]);

  const fetchPaper = async () => {
    try {
      const response = await api.get(`/research/papers/${id}`);
      if (response.data.status === 'published') {
        toast.error('This paper is already published');
        navigate(`/research/${id}`);
        return;
      }
      setPaper(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch paper');
      navigate('/research');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paper_url.trim()) {
      toast.error('Paper URL is required');
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/research/papers/${id}/publish`, formData);
      toast.success('Research paper published successfully');
      navigate(`/research/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to publish paper');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!paper) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Publish Research Paper</h1>
              <p className="text-gray-600 mt-1">Add publication details for your paper</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Paper Title</h2>
            <p className="text-gray-700">{paper.title}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="paper_url" className="block text-sm font-medium text-gray-700 mb-2">
                Paper URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="url"
                  id="paper_url"
                  name="paper_url"
                  value={formData.paper_url}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://example.com/your-paper.pdf"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Provide a link to the full research paper (PDF, arXiv, journal website, etc.)
              </p>
            </div>

            <div>
              <label htmlFor="doi" className="block text-sm font-medium text-gray-700 mb-2">
                DOI (Digital Object Identifier)
              </label>
              <input
                type="text"
                id="doi"
                name="doi"
                value={formData.doi}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., 10.1234/example.doi"
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Add the DOI if your paper has been assigned one
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">What happens when you publish?</h3>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Your paper status will change from "Abstract" to "Published"</li>
                <li>The publication date will be recorded</li>
                <li>Users can access the full paper via the provided URL</li>
                <li>Your paper will be featured in the published papers section</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(`/research/${id}`)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                {submitting ? 'Publishing...' : 'Publish Paper'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
