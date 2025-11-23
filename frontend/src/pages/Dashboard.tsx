import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, LogOut, Plus, FileType, Presentation, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { projects, addProject, deleteProject, setCurrentProject } = useProjectStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const loadProjects = useProjectStore((state) => (state as any).loadProjects);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Load projects from backend once, only if authenticated
    if (!isInitialized && isAuthenticated) {
      loadProjects();
      setIsInitialized(true);
    }
  }, [isInitialized, isAuthenticated, loadProjects]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleNewProject = () => {
    navigate('/project/new');
  };

  const handleOpenProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      navigate(`/project/${projectId}`);
    }
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProject(projectId);
    toast.success('Project deleted');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI DocuForge</h1>
              <p className="text-xs text-muted-foreground">Document Authoring Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Projects</h2>
            <p className="text-muted-foreground mt-1">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} created
            </p>
          </div>
          <Button onClick={handleNewProject} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="border-dashed border-2 animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                Create your first AI-powered document to get started
              </p>
              <Button onClick={handleNewProject}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Card
                key={project.id}
                className="hover-lift cursor-pointer transition-all hover:border-primary/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleOpenProject(project.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {project.docType === 'docx' ? (
                        <FileType className="w-5 h-5 text-primary" />
                      ) : (
                        <Presentation className="w-5 h-5 text-primary" />
                      )}
                      <span className="text-xs font-medium text-primary uppercase">
                        {project.docType}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="mt-2 line-clamp-2">{project.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{project.topic}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(project.updatedAt, 'MMM d, yyyy')}
                    </div>
                    <div>{project.sections.length} sections</div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleOpenProject(project.id)}>
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
