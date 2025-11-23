import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Section } from '@/stores/projectStore';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { refinementPresets } from '@/lib/mockData';
import { ThumbsUp, ThumbsDown, MessageSquare, History, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface RefinementPanelProps {
  projectId: string;
  section: Section;
}

export const RefinementPanel = ({ projectId, section }: RefinementPanelProps) => {
  const { updateSection, addRevision, addComment } = useProjectStore();
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [comment, setComment] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handlePreset = (prompt: string) => {
    setRefinementPrompt(prompt);
  };

  const handleRefine = async () => {
    if (!refinementPrompt.trim()) {
      toast.error('Please enter a refinement prompt');
      return;
    }

    setIsRefining(true);
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        toast.error('You must be logged in to refine content.');
        setIsRefining(false);
        return;
      }
      const res = await api.post(`/api/projects/${projectId}/refine`, { sectionId: section.id, prompt: refinementPrompt });
      const out = res.data as any;
      const refined = out.text || '';
      // Update editor content via section update
      updateSection(projectId, section.id, { content: refined });
      // Persist a local revision entry
      addRevision(projectId, section.id, { content: refined, prompt: refinementPrompt });
      toast.success('Content refined successfully!');
      setRefinementPrompt('');
    } catch (e) {
      console.error('Refine failed', e);
      toast.error('Failed to refine content');
    } finally {
      setIsRefining(false);
    }
  };

  const handleLike = () => {
    updateSection(projectId, section.id, { liked: true });
    toast.success('Feedback recorded');
  };

  const handleDislike = () => {
    updateSection(projectId, section.id, { liked: false });
    toast.success('Feedback recorded');
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    addComment(projectId, section.id, comment);
    toast.success('Comment added');
    setComment('');
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Refinement Tools
        </h2>

        {/* Quick Presets */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
            <CardDescription className="text-xs">
              Apply common refinements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {refinementPresets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => handlePreset(preset.prompt)}
              >
                <Sparkles className="w-3 h-3 mr-2" />
                {preset.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Custom Refinement */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="refinement">Custom Refinement</Label>
          <Textarea
            id="refinement"
            placeholder="Describe how you want to refine this section..."
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            rows={4}
            className="text-sm"
          />
          <Button onClick={handleRefine} disabled={isRefining} className="w-full" size="sm">
            {isRefining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Refining...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Refine with AI
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Feedback */}
        <div className="space-y-2 my-4">
          <Label>Feedback</Label>
          <div className="flex space-x-2">
            <Button
              variant={section.liked === true ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={handleLike}
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <Button
              variant={section.liked === false ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={handleDislike}
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Comments */}
        <div className="space-y-2 my-4">
          <Label htmlFor="comment">Add Comment</Label>
          <Textarea
            id="comment"
            placeholder="Add notes or suggestions..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <Button onClick={handleAddComment} variant="outline" size="sm" className="w-full">
            <MessageSquare className="w-4 h-4 mr-2" />
            Add Comment
          </Button>
        </div>

        {(section.comments ?? []).length > 0 && (
          <div className="space-y-2">
            {(section.comments ?? []).map((c) => (
              <Card key={c.id} className="p-3">
                <p className="text-xs mb-1">{c.text}</p>
                <p className="text-xs text-muted-foreground">
                  {format(c.timestamp, 'MMM d, h:mm a')}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Revision History */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Revision History</h3>
        </div>
        {(section.revisions ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No revisions yet</p>
        ) : (
          <div className="space-y-2">
            {(section.revisions ?? []).map((revision) => (
              <Card key={revision.id} className="p-3">
                <p className="text-xs font-medium mb-1">{revision.prompt}</p>
                <p className="text-xs text-muted-foreground">
                  {format(revision.timestamp, 'MMM d, h:mm a')}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
