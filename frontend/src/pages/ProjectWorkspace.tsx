import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { OutlinePanel } from '@/components/workspace/OutlinePanel';
import { EditorPanel } from '@/components/workspace/EditorPanel';
import { RefinementPanel } from '@/components/workspace/RefinementPanel';
import TemplatePicker from '@/components/TemplatePicker';
import api from '@/lib/api';
import { toast } from 'sonner';

const ProjectWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, setCurrentProject, currentProject } = useProjectStore();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setCurrentProject(project);
      if (!selectedSectionId && project.sections.length > 0) {
        setSelectedSectionId(project.sections[0].id);
      }
    } else {
      navigate('/dashboard');
    }
  }, [id, projects, setCurrentProject, navigate, selectedSectionId]);

  const handleExport = () => {
    // build deck and POST to generate_pptx endpoint
    (async () => {
      if (!currentProject) return;
      setIsExporting(true);
      try {
        // build a DeckModel from currentProject and selectedTemplate
        const deck: any = {
          title: currentProject.title,
          // frontend Project doesn't expose owner; use project title as fallback author
          author: currentProject.title,
          template: selectedTemplate || {},
          slides: [],
        };

        // first slide: title
        deck.slides.push({ type: 'title', title: currentProject.title, subtitle: currentProject.docType.toUpperCase(), images: [] });

        // map sections to summary slides
        for (const s of currentProject.sections) {
          const content = s.content || '';
          // split into paragraphs and use first few as bullets
          const paras = content.split(/\n+/).map((p: string) => p.trim()).filter(Boolean);
          const bullets = paras.slice(0, 6);
          deck.slides.push({ type: 'summary', title: s.title, bullets, notes: '' });
        }

        if (currentProject.docType === 'pptx') {
          const axiosRes = await api.post('/api/projects/generate_pptx', deck, { responseType: 'blob' });
          const blob = axiosRes.data;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${(currentProject.title || 'presentation').replace(/[^a-z0-9_-]/gi, '_')}.pptx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          toast.success('PPTX generated and downloaded');
        } else {
          // docx export via project export endpoint
          // include client-side sections so unsaved edits are preserved in the exported .docx
          const clientSections = currentProject.sections.map((s: any) => ({ id: s.id, title: s.title, content: s.content }));
          const res = await api.post(`/api/projects/${currentProject.id}/export`, { format: 'docx', clientSections }, { responseType: 'blob' as any });
          const blob = res.data;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${(currentProject.title || 'document').replace(/[^a-z0-9_-]/gi, '_')}.docx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          toast.success('DOCX generated and downloaded');
        }
      } catch (e: any) {
        console.error('Export failed', e);
        toast.error('Export failed: ' + (e.message || 'unknown'));
      } finally {
        setIsExporting(false);
      }
    })();
  };

  const handleSaveAndExport = async () => {
    if (!currentProject) return;
    if (!selectedSectionId) {
      toast.error('No section selected to save');
      return;
    }
    setIsExporting(true);
    try {
      const selected = currentProject.sections.find((s: any) => s.id === selectedSectionId);
      if (!selected) {
        toast.error('Selected section not found');
        return;
      }

      // Persist current editor content for the selected section
      await api.post(`/api/projects/${currentProject.id}/sections/${selectedSectionId}/save`, { title: selected.title, content: selected.content });
      // After save, trigger export matching the project's docType
      if (currentProject.docType === 'pptx') {
        // build a DeckModel from currentProject and selectedTemplate
        const deck: any = {
          title: currentProject.title,
          author: currentProject.title,
          template: selectedTemplate || {},
          slides: [],
        };
        // first slide: title
        deck.slides.push({ type: 'title', title: currentProject.title, subtitle: currentProject.docType.toUpperCase(), images: [] });
        // map sections to summary slides using current in-memory content
        for (const s of currentProject.sections) {
          const content = s.content || '';
          const paras = content.split(/\n+/).map((p: string) => p.trim()).filter(Boolean);
          const bullets = paras.slice(0, 6);
          deck.slides.push({ type: 'summary', title: s.title, bullets, notes: '' });
        }

        const axiosRes = await api.post('/api/projects/generate_pptx', deck, { responseType: 'blob' });
        const blob = axiosRes.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(currentProject.title || 'presentation').replace(/[^a-z0-9_-]/gi, '_')}.pptx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Draft saved and PPTX downloaded');
      } else {
        // DOCX export
        const res = await api.post(`/api/projects/${currentProject.id}/export`, { format: 'docx' }, { responseType: 'blob' as any });
        const blob = res.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(currentProject.title || 'document').replace(/[^a-z0-9_-]/gi, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Draft saved and DOCX downloaded');
      }
    } catch (e: any) {
      console.error('Save & Export failed', e);
      toast.error('Save & Export failed: ' + (e?.message || 'unknown'));
    } finally {
      setIsExporting(false);
    }
  };

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedSection = currentProject.sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{currentProject.title}</h1>
              <p className="text-xs text-muted-foreground">{currentProject.docType.toUpperCase()}</p>
            </div>
          </div>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export {currentProject.docType.toUpperCase()}
          </Button>
          <Button onClick={handleSaveAndExport} disabled={isExporting} className="ml-2">
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Save & Export
          </Button>
        </div>
      </header>

      {/* Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Outline Panel */}
        <aside className="w-72 border-r bg-card/30 overflow-y-auto">
          <OutlinePanel
            project={currentProject}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
          />
        </aside>

        {/* Center: Editor */}
        <main className="flex-1 overflow-y-auto">
          {selectedSection ? (
            <EditorPanel
              projectId={currentProject.id}
              section={selectedSection}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a section to edit
            </div>
          )}
        </main>

        {/* Right: Refinement Panel */}
        <aside className="w-80 border-l bg-card/30 overflow-y-auto">
          <div className="p-3">
            <TemplatePicker topic={currentProject.topic} value={selectedTemplate} onChange={setSelectedTemplate} />
          </div>
          {selectedSection && (
            <RefinementPanel
              projectId={currentProject.id}
              section={selectedSection}
            />
          )}
        </aside>
      </div>
    </div>
  );
};

export default ProjectWorkspace;
