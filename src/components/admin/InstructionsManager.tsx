
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const InstructionsManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newInstruction, setNewInstruction] = useState({ text: '', priority: 1 });
  const [editInstruction, setEditInstruction] = useState({ text: '', priority: 1 });
  const queryClient = useQueryClient();

  const { data: instructions, isLoading } = useQuery({
    queryKey: ['chatbot-instructions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_instructions')
        .select('*')
        .order('priority');
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (instruction: { text: string; priority: number }) => {
      const { data, error } = await supabase
        .from('chatbot_instructions')
        .insert({
          instruction_text: instruction.text,
          priority: instruction.priority
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-instructions'] });
      setNewInstruction({ text: '', priority: 1 });
      toast({ title: "Success", description: "Instruction added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add instruction", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, instruction }: { id: string; instruction: { text: string; priority: number } }) => {
      const { data, error } = await supabase
        .from('chatbot_instructions')
        .update({
          instruction_text: instruction.text,
          priority: instruction.priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-instructions'] });
      setEditingId(null);
      toast({ title: "Success", description: "Instruction updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update instruction", variant: "destructive" });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('chatbot_instructions')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-instructions'] });
      toast({ title: "Success", description: "Instruction status updated" });
    }
  });

  const startEdit = (instruction: any) => {
    setEditingId(instruction.id);
    setEditInstruction({
      text: instruction.instruction_text,
      priority: instruction.priority
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading instructions...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Instruction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Input
              type="number"
              value={newInstruction.priority}
              onChange={(e) => setNewInstruction(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              className="w-24"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Instruction Text</label>
            <Textarea
              value={newInstruction.text}
              onChange={(e) => setNewInstruction(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Enter instruction text..."
              rows={3}
            />
          </div>
          <Button 
            onClick={() => createMutation.mutate(newInstruction)}
            disabled={!newInstruction.text || createMutation.isPending}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Instruction
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instructions?.map((instruction) => (
              <div key={instruction.id} className="border rounded-lg p-4">
                {editingId === instruction.id ? (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div>
                        <label className="text-sm font-medium">Priority</label>
                        <Input
                          type="number"
                          value={editInstruction.priority}
                          onChange={(e) => setEditInstruction(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                          className="w-24"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Instruction Text</label>
                      <Textarea
                        value={editInstruction.text}
                        onChange={(e) => setEditInstruction(prev => ({ ...prev, text: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => updateMutation.mutate({ id: instruction.id, instruction: editInstruction })}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                      <Button 
                        onClick={() => setEditingId(null)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Priority: {instruction.priority}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          instruction.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {instruction.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-700">{instruction.instruction_text}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => startEdit(instruction)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => toggleActiveMutation.mutate({ id: instruction.id, isActive: instruction.is_active })}
                        variant={instruction.is_active ? "destructive" : "default"}
                        size="sm"
                      >
                        {instruction.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructionsManager;
