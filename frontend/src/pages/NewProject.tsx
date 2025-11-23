import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, DocumentType, Section } from '@/stores/projectStore';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileType, Presentation, ArrowLeft, Plus, Trash2, GripVertical, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const NewProject = () => {
  const navigate = useNavigate();
  const addProject = useProjectStore((state) => state.addProject);
  
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('docx');
  const [topic, setTopic] = useState('');
  const [sections, setSections] = useState<Array<{ id: string; title: string }>>([
    { id: '1', title: 'Introduction' },
  ]);

  const handleAddSection = () => {
    setSections([
      ...sections,
      { id: Date.now().toString(), title: '' },
    ]);
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length > 1) {
      setSections(sections.filter((s) => s.id !== id));
    }
  };

  const handleUpdateSection = (id: string, title: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, title } : s)));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSections(items);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!title || !topic) {
        toast.error('Please fill in all fields');
        return;
      }
      setStep(2);
    }
  };

  const handleSuggestOutline = async () => {
    if (!topic) {
      toast.error('Please enter a topic to generate an outline');
      return;
    }
    try {
      const res = await api.post('/api/projects/suggest_outline', { topic, docType });
      const titles: string[] = res.data.titles || [];
      if (titles.length === 0) {
        toast.error('No outline suggested');
        return;
      }
      // show modal preview and allow edit/accept
      setSuggestedTitles(titles);
      setIsSuggestOpen(true);
    } catch (e) {
      console.error('Failed to suggest outline', e);
      toast.error('Failed to get outline from AI');
    }
  };

  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);

  const handleApplySuggested = () => {
    const newSections = suggestedTitles.map((t, idx) => ({ id: Date.now().toString() + '-' + idx, title: t }));
    setSections(newSections);
    setIsSuggestOpen(false);
    toast.success('Outline applied. You can edit before creating.');
  };

  const handleCancelSuggested = () => {
    setIsSuggestOpen(false);
  };

  const handleCreate = () => {
    const validSections = sections.filter((s) => s.title.trim());
    if (validSections.length === 0) {
      toast.error('Please add at least one section');
      return;
    }
    const projectSections: Section[] = validSections.map((s, index) => ({
      id: s.id,
      title: s.title,
      content: '',
      order: index,
      revisions: [],
      comments: [],
    }));

    (async () => {
      const created = await addProject({
        title,
        docType,
        topic,
        sections: projectSections,
      });
      if (created) {
        toast.success('Project created successfully!');
        navigate(`/project/${created.id}`);
      } else {
        toast.error('Failed to create project');
      }
    })();
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Project</h1>
          <p className="text-muted-foreground">
            Step {step} of 2: {step === 1 ? 'Basic Information' : 'Document Structure'}
          </p>
        </div>

        {step === 1 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Define the basic information for your document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Market Analysis Report 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Main Topic / Prompt</Label>
                <Textarea
                  id="topic"
                  placeholder="Describe what you want to create. Be specific to get better AI-generated content..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label>Document Type</Label>
                <RadioGroup value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      htmlFor="docx"
                      className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        docType === 'docx'
                          ? 'border-primary bg-primary-light'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="docx" id="docx" />
                      <div className="flex items-center space-x-2">
                        <FileType className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Word Document</p>
                          <p className="text-xs text-muted-foreground">.docx format</p>
                        </div>
                      </div>
                    </label>

                    <label
                      htmlFor="pptx"
                      className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        docType === 'pptx'
                          ? 'border-primary bg-primary-light'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="pptx" id="pptx" />
                      <div className="flex items-center space-x-2">
                        <Presentation className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Presentation</p>
                          <p className="text-xs text-muted-foreground">.pptx format</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} size="lg">
                  Next: Define Structure
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>
                {docType === 'docx' ? 'Document Outline' : 'Presentation Slides'}
              </CardTitle>
              <CardDescription>
                {docType === 'docx'
                  ? 'Define the sections for your document. Drag to reorder.'
                  : 'Define the slides for your presentation. Drag to reorder.'}
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleSuggestOutline} className="mb-2">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Suggest Outline
                  </Button>
                </div>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {sections.map((section, index) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border"
                            >
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <Input
                                  placeholder={`${docType === 'docx' ? 'Section' : 'Slide'} ${index + 1} title`}
                                  value={section.title}
                                  onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                                />
                              </div>
                              {sections.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveSection(section.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <Button variant="outline" onClick={handleAddSection} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add {docType === 'docx' ? 'Section' : 'Slide'}
              </Button>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleCreate} size="lg">
                  Create Project
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      {/* Suggest Outline Preview Dialog */}
      <Dialog open={isSuggestOpen} onOpenChange={(open) => setIsSuggestOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Suggested Outline</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Edit titles if needed, then Accept to apply to your project.</p>
            <div className="mt-2 space-y-2">
              {suggestedTitles.map((t, idx) => (
                <Input
                  key={idx}
                  value={t}
                  onChange={(e) => setSuggestedTitles((s) => s.map((x, i) => (i === idx ? e.target.value : x)))}
                  className="text-sm"
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancelSuggested}>Cancel</Button>
              <Button onClick={handleApplySuggested}>Apply Outline</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewProject;
