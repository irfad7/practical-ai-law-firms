import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const KnowledgeBaseManager = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['knowledge-base'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('upload_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileData: { filename: string; content: string; fileType: string; fileSize: number }) => {
      console.log('Uploading file:', fileData.filename);
      const { data, error } = await supabase.functions.invoke('knowledge-upload', {
        body: fileData
      });
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast({ title: "Success", description: "Document uploaded successfully" });
    },
    onError: (error: any) => {
      console.error('Upload mutation error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to upload document: ${error.message}`, 
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Attempting to delete document with ID:', id);
      const { data, error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id)
        .select(); // Add select to see what was deleted
      
      console.log('Delete response:', { data, error });
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Document deleted successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Delete mutation success:', data);
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast({ title: "Deleted", description: "Document deleted successfully" });
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error);
      toast({ 
        title: "Error", 
        description: `Failed to delete document: ${error.message}`, 
        variant: "destructive" 
      });
    }
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ 
          title: "File too large", 
          description: `${file.name} is larger than 5MB`, 
          variant: "destructive" 
        });
        continue;
      }

      try {
        let content = '';
        
        // Handle different file types
        if (file.type === 'application/pdf') {
          // For now, we'll store PDF info but not extract text content
          // In a production app, you'd use a PDF parsing library
          content = `PDF file: ${file.name} (${file.size} bytes). Content extraction not implemented yet.`;
        } else if (file.type.startsWith('text/') || 
                   file.type === 'application/json' ||
                   file.name.endsWith('.md') ||
                   file.name.endsWith('.txt')) {
          // Only read as text for actual text files
          content = await file.text();
        } else {
          // For other file types, store basic info
          content = `File: ${file.name} (${file.type}, ${file.size} bytes). Content extraction not supported for this file type.`;
        }

        console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
        
        await uploadMutation.mutateAsync({
          filename: file.name,
          content,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size
        });
      } catch (error) {
        console.error('File processing error:', error);
        toast({ 
          title: "Error", 
          description: `Failed to process ${file.name}: ${error.message}`, 
          variant: "destructive" 
        });
      }
    }
    
    setUploading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading knowledge base...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports: .txt, .md, .pdf, .docx (Max 5MB per file)
            </p>
            <Input
              type="file"
              multiple
              accept=".txt,.md,.pdf,.docx"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <Button 
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Choose Files'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Documents ({documents?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents?.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-medium">{doc.filename}</h3>
                    <div className="text-sm text-gray-500 space-x-2">
                      <span>{doc.file_type}</span>
                      {doc.file_size && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Uploaded {new Date(doc.upload_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([doc.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = doc.filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${doc.filename}"?`)) {
                        console.log('Deleting document:', doc);
                        deleteMutation.mutate(doc.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!documents || documents.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No documents uploaded yet. Upload some files to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBaseManager;
