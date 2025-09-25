import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, MessageSquare, Bot, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ChatLogsViewer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  // Debounce searchTerm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: chatLogs, isLoading } = useQuery({
    queryKey: ['chat-logs', debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from('chat_analytics')
        .select('*')
        .order('timestamp', { ascending: false });

      if (debouncedSearchTerm) {
        query = query.or(`user_message.ilike.%${debouncedSearchTerm}%,ai_response.ilike.%${debouncedSearchTerm}%,user_email.ilike.%${debouncedSearchTerm}%`);
      }

      const { data, error } = await query.limit(500);
      
      if (error) throw error;
      return data;
    }
  });

  const groupedChats = chatLogs?.reduce((acc, chat) => {
    const email = chat.user_email || 'anonymous@example.com';
    if (!acc[email]) {
      acc[email] = [];
    }
    acc[email].push(chat);
    return acc;
  }, {} as Record<string, typeof chatLogs>);

  const exportLogs = () => {
    if (!chatLogs) return;
    
    const csvContent = [
      ['Date', 'Time', 'Email', 'Session ID', 'User Message', 'AI Response', 'Response Time (ms)', 'Tokens Used'],
      ...chatLogs.map(chat => [
        new Date(chat.timestamp).toLocaleDateString(),
        new Date(chat.timestamp).toLocaleTimeString(),
        chat.user_email || 'anonymous@example.com',
        chat.session_id,
        chat.user_message.replace(/"/g, '""'),
        chat.ai_response.replace(/"/g, '""'),
        chat.response_time_ms?.toString() || '',
        chat.tokens_used?.toString() || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading chat logs...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search & Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email, messages, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={exportLogs} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Users ({Object.keys(groupedChats || {}).length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(groupedChats || {}).map(([email, chats]) => {
                const latestChat = chats[0];
                const { date, time } = formatDateTime(latestChat.timestamp);
                
                return (
                  <div
                    key={email}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedEmail === email
                        ? 'bg-blue-100 border-blue-300 border'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {email}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      {chats.length} message{chats.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {date}
                      <Clock className="h-3 w-3 ml-1" />
                      {time}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedEmail ? `Chat History for ${selectedEmail}` : 'Select a user to view chat history'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEmail && groupedChats?.[selectedEmail] ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {groupedChats[selectedEmail]
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((chat) => {
                    const { date, time } = formatDateTime(chat.timestamp);
                    
                    return (
                      <div key={chat.id} className="space-y-3 border-b border-gray-100 pb-4 last:border-b-0">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4" />
                          {date}
                          <Clock className="h-4 w-4 ml-2" />
                          {time}
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-600 mb-1">User</div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm">{chat.user_message}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Bot className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                              Ava
                              {chat.response_time_ms && (
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                  {chat.response_time_ms}ms
                                </span>
                              )}
                              {chat.tokens_used && (
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                  {chat.tokens_used} tokens
                                </span>
                              )}
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-sm">{chat.ai_response}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a user from the left to view their chat history
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatLogsViewer;
