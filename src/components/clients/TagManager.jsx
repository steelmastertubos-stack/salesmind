import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Tag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function TagManager({ client, onUpdate, readonly = false }) {
  const [newTag, setNewTag] = useState('');
  const manualTags = client?.manual_tags || [];
  const autoTags = client?.auto_tags || [];

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const trimmed = newTag.trim();
    if (manualTags.includes(trimmed)) {
      toast.error('Tag já existe');
      return;
    }

    onUpdate({ manual_tags: [...manualTags, trimmed] });
    setNewTag('');
    toast.success('Tag adicionada');
  };

  const handleRemoveTag = (tag) => {
    onUpdate({ manual_tags: manualTags.filter(t => t !== tag) });
    toast.success('Tag removida');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-4">
      {/* Tags Automáticas */}
      {autoTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <p className="text-xs font-semibold text-slate-700">Tags Automáticas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {autoTags.map((tag, idx) => (
              <Badge 
                key={idx} 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              >
                {tag}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-slate-500 italic">
            Calculadas automaticamente com base no histórico
          </p>
        </div>
      )}

      {/* Tags Manuais */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-600" />
          <p className="text-xs font-semibold text-slate-700">Tags Manuais</p>
        </div>
        
        {!readonly && (
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleAddTag}
              size="icon"
              className="bg-[#1DB954] hover:bg-[#15803d]"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {manualTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {manualTags.map((tag, idx) => (
              <Badge 
                key={idx} 
                variant="outline"
                className="bg-slate-100 text-slate-700 pr-1"
              >
                {tag}
                {!readonly && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Nenhuma tag manual adicionada</p>
        )}
      </div>
    </div>
  );
}