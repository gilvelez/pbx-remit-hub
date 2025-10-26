import React, { useState, useEffect } from 'react';
import { Download, Mail, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getMockSubmissions } from '../data/mock';
import { useToast } from '../hooks/use-toast';

export const Admin = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    loadSubmissions();
    // Refresh every 5 seconds to catch new submissions
    const interval = setInterval(loadSubmissions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSubmissions = () => {
    const data = getMockSubmissions();
    setSubmissions(data);
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Timestamp'];
    const rows = submissions.map(s => [
      s.email,
      new Date(s.timestamp).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pbx-submissions-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Export successful',
      description: `Exported ${submissions.length} email submissions`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 via-red-500 to-yellow-400" aria-hidden="true" />
            <span className="text-xl font-bold tracking-tight">PBX Admin</span>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Back to landing
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Early Access Submissions</h1>
            <p className="text-slate-600 mt-1">Manage and export email submissions</p>
          </div>
          <Button 
            onClick={exportToCSV}
            disabled={submissions.length === 0}
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
              <CardTitle className="text-sm font-medium text-slate-600">Total Submissions</CardTitle>
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
                  const date = new Date(s.timestamp);
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
                  const date = new Date(s.timestamp);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return date >= weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions table */}
        <Card>
          <CardHeader>
            <CardTitle>All Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No submissions yet</p>
                <p className="text-sm mt-1">Email submissions will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Timestamp</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium">{sub.email}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {new Date(sub.timestamp).toLocaleString()}
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

        {/* Note */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is a demo using localStorage. In production, submissions will be saved to the database with proper authentication.
          </p>
        </div>
      </main>
    </div>
  );
};
