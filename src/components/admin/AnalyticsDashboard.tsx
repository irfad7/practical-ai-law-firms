import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Clock, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AnalyticsDashboard = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['chat-analytics'],
    queryFn: async () => {
      const { data: chats } = await supabase
        .from('chat_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: questions } = await supabase
        .from('popular_questions')
        .select('*')
        .order('frequency', { ascending: false })
        .limit(5);

      const totalChats = chats?.length || 0;
      const avgResponseTime = chats?.reduce((acc, chat) => acc + (chat.response_time_ms || 0), 0) / totalChats || 0;
      const uniqueSessions = new Set(chats?.map(chat => chat.session_id)).size;
      const todayChats = chats?.filter(chat => 
        new Date(chat.created_at).toDateString() === new Date().toDateString()
      ).length || 0;

      // Count unique users by user_email if available, otherwise by session_id
      const userIdentifiers = chats?.map(chat => chat.user_email || chat.session_id) || [];
      const uniqueChatUsers = new Set(userIdentifiers).size;

      return {
        uniqueChatUsers,
        avgResponseTime: Math.round(avgResponseTime),
        uniqueSessions,
        todayChats,
        popularQuestions: questions || []
      };
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Chat Users</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.uniqueChatUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.avgResponseTime}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Chats</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.todayChats}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popular Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics?.popularQuestions.map((question, index) => (
              <div key={question.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{question.question_text}</p>
                  <p className="text-xs text-gray-500">
                    Last asked: {new Date(question.last_asked).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{question.frequency}</div>
                  <div className="text-xs text-gray-500">times</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
