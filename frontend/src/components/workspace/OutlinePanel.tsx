import { Project, Section } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileType, Presentation, Plus } from 'lucide-react';

interface OutlinePanelProps {
  project: Project;
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
}

export const OutlinePanel = ({ project, selectedSectionId, onSelectSection }: OutlinePanelProps) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {project.docType === 'docx' ? 'Sections' : 'Slides'}
        </h2>
        <Button variant="ghost" size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {project.sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={cn(
              'w-full text-left p-3 rounded-lg transition-all hover:bg-accent/50',
              selectedSectionId === section.id
                ? 'bg-primary/10 border border-primary/30'
                : 'border border-transparent'
            )}
          >
            <div className="flex items-start space-x-2">
              {project.docType === 'docx' ? (
                <FileType className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              ) : (
                <Presentation className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2">{section.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {section.content ? `${section.content.length} chars` : 'Empty'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
