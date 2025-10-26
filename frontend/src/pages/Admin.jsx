import React, { useState, useEffect } from 'react';
import { Download, Mail, Clock, AlertCircle, Search, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Admin = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const storedAuth = sessionStorage.getItem('pbx_admin_auth');
    if (storedAuth) {
      const { username, password } = JSON.parse(storedAuth);
      loadSubmissions(username, password);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Filter submissions based on search query
    if (searchQuery.trim() === '') {
      setFilteredSubmissions(submissions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = submissions.filter(sub => 
        sub.email.toLowerCase().includes(query) ||
        new Date(sub.created_at).toLocaleString().toLowerCase().includes(query)
      );
      setFilteredSubmissions(filtered);
    }
  }, [searchQuery, submissions]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    await loadSubmissions(username, password);
  };

  const loadSubmissions = async (user, pass) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${API}/leads`, {
        auth: {
          username: user,
          password: pass
        }
      });
      
      setSubmissions(data);
      setFilteredSubmissions(data);
      setIsAuthenticated(true);
      
      // Store credentials in sessionStorage
      sessionStorage.setItem('pbx_admin_auth', JSON.stringify({ username: user, password: pass }));
      
      toast({
        title: 'Success',
        description: `Loaded ${data.length} submissions`
      });
    } catch (error) {
      console.error('Error loading submissions:', error);
      
      if (error.response?.status === 401) {
        setAuthError('Invalid credentials. Please check your password and try again.');
        setIsAuthenticated(false);
        sessionStorage.removeItem('pbx_admin_auth');
      } else {
        setAuthError('Failed to load submissions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('pbx_admin_auth');
    setUsername('admin');
    setPassword('');
    setSubmissions([]);
    setFilteredSubmissions([]);
    setSearchQuery('');
  };

  const exportToCSV = () => {
    // RFC4180 compliant CSV export
    const escapeCSVField = (field) => {
      // Convert to string
      const str = String(field);
      
      // If field contains comma, newline, or double quote, wrap in quotes and escape quotes
      if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    // CSV header
    const headers = ['Email', 'Created At'];
    const headerRow = headers.map(escapeCSVField).join(',');
    
    // CSV rows
    const rows = filteredSubmissions.map(s => {
      const row = [
        s.email,
        new Date(s.created_at).toISOString()
      ];
      return row.map(escapeCSVField).join(',');
    });
    
    // Combine with CRLF line endings (RFC4180)
    const csvContent = [headerRow, ...rows].join('\r\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pbx-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Export successful',
      description: `Exported ${filteredSubmissions.length} leads to CSV`,
    });
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-sky-500 via-red-500 to-yellow-400" />
            </div>
            <CardTitle className="text-2xl text-center">PBX Admin</CardTitle>
            <p className="text-sm text-slate-600 text-center mt-2">Enter password to access lead management</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  disabled
                  className="bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoFocus
                />
              </div>
              
              {authError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-sky-600 hover:bg-sky-700" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Access Admin Panel'
                )}
              </Button>
              
              <div className="text-center">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => window.location.href = '/'} 
                  className="w-full"
                >
                  Back to Landing Page
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 via-red-500 to-yellow-400" aria-hidden="true" />
            <span className="text-xl font-bold tracking-tight">PBX Admin</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-sm text-slate-500 hidden sm:inline">Lead Management</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLogout} size="sm">
              Logout
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} size="sm">
              Back to Landing
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with search and export */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Early Access Leads</h1>
            <p className="text-slate-600 mt-1">Manage email submissions and export data</p>
          </div>
          <Button 
            onClick={exportToCSV}
            disabled={filteredSubmissions.length === 0}
            className="bg-sky-600 hover:bg-sky-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{submissions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {submissions.filter(s => {
                  const date = new Date(s.created_at);
                  const today = new Date();
                  return date.toDateString() === today.toDateString();
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {submissions.filter(s => {
                  const date = new Date(s.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return date >= weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search box */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by email or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-slate-500 mt-2">
                Showing {filteredSubmissions.length} of {submissions.length} leads
              </p>
            )}
          </CardContent>
        </Card>

        {/* Leads table */}
        <Card>
          <CardHeader>
            <CardTitle>All Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
                <p className="text-slate-500">Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                {searchQuery ? (
                  <>
                    <p className="text-slate-700 font-medium">No matches found</p>
                    <p className="text-sm text-slate-500 mt-1">Try a different search term</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="mt-4"
                    >
                      Clear search
                    </Button>
                  </>
                ) : submissions.length === 0 ? (
                  <>
                    <p className="text-slate-700 font-medium">No leads yet</p>
                    <p className="text-sm text-slate-500 mt-1">Email submissions will appear here</p>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Created At</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{sub.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {new Date(sub.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info note */}
        <div className="mt-6 p-4 bg-sky-50 border border-sky-200 rounded-lg">
          <p className="text-sm text-sky-800">
            <strong>ℹ️ Info:</strong> Data is fetched from MongoDB with Basic Authentication (username: admin). 
            Showing last 500 leads, newest first. CSV exports are RFC4180 compliant.
          </p>
        </div>
      </main>
    </div>
  );
};
