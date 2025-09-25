import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, MessageSquare, BookOpen, Settings, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AdminAuth from '@/components/AdminAuth';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import InstructionsManager from '@/components/admin/InstructionsManager';
import KnowledgeBaseManager from '@/components/admin/KnowledgeBaseManager';
import ChatLogsViewer from '@/components/admin/ChatLogsViewer';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('knowledge');

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
  };

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your AI chatbot system</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="instructions" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Instructions
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="instructions">
            <InstructionsManager />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeBaseManager />
          </TabsContent>

          <TabsContent value="chats" forceMount>
            <ChatLogsViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
