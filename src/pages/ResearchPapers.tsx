import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Plus, Filter, Calendar, User } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

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
  owner: {
    id: number;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  created_at: string;
}

export default function ResearchPapers() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPapers();
  }, []);

  useEffect(() => {
    filterPapers();
  }, [searchQuery, statusFilter, papers]);

  const fetchPapers = async () => {
    try {
      const response = await api.get('/research/papers');
      setPapers(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch research papers');
    } finally {
      setLoading(false);
    }
  };

  const filterPapers = () => {
    let filtered = papers;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.abstract.toLowerCase().includes(query) ||
        p.authors.toLowerCase().includes(query) ||
        p.keywords?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    setFilteredPapers(filtered);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              Research Papers
            </h1>
            <p className="text-gray-600 mt-2">Share and discover academic research</p>
          </div>
          <button
            onClick={() => navigate('/research/upload-abstract')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Upload Abstract
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search papers by title, authors, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Papers</option>
                <option value="abstract">Abstract Only</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {filteredPapers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No papers found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Be the first to share your research!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                onClick={() => navigate(`/research/${paper.id}`)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{paper.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          paper.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {paper.status === 'published' ? 'Published' : 'Abstract'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{paper.abstract}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {paper.category && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                          {paper.category}
                        </span>
                      )}
                      {paper.keywords?.split(',').map((keyword, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{paper.authors}</span>
                    </div>
                    {paper.publication_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(paper.publication_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {paper.owner.avatar_url ? (
                      <img
                        src={paper.owner.avatar_url}
                        alt={paper.owner.full_name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {paper.owner.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-gray-600">{paper.owner.full_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
