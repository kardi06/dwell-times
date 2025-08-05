import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Kanban } from 'lucide-react';
import ProjectCard from './ProjectCard';

interface ProjectMember {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  teamMembers: ProjectMember[];
  taskCount: number;
  completedTasks: number;
  dueDate: Date;
  status: 'active' | 'completed' | 'on-hold';
}

interface ProjectManagementSectionProps {
  projects: Project[];
  loading: boolean;
  onCreateProject: () => void;
}

const ProjectManagementSection: React.FC<ProjectManagementSectionProps> = ({
  projects,
  loading,
  onCreateProject
}) => {
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Analytics Dashboard Redesign',
      description: 'Modernize the analytics dashboard with new UI components and improved user experience.',
      progress: 75,
      teamMembers: [
        { id: '1', name: 'John Doe', initials: 'JD' },
        { id: '2', name: 'Jane Smith', initials: 'JS' },
        { id: '3', name: 'Mike Johnson', initials: 'MJ' },
        { id: '4', name: 'Sarah Wilson', initials: 'SW' }
      ],
      taskCount: 12,
      completedTasks: 9,
      dueDate: new Date('2024-02-15'),
      status: 'active'
    },
    {
      id: '2',
      name: 'Data Pipeline Optimization',
      description: 'Optimize the data processing pipeline for better performance and reliability.',
      progress: 45,
      teamMembers: [
        { id: '5', name: 'Alex Brown', initials: 'AB' },
        { id: '6', name: 'Emily Davis', initials: 'ED' }
      ],
      taskCount: 8,
      completedTasks: 4,
      dueDate: new Date('2024-03-01'),
      status: 'active'
    },
    {
      id: '3',
      name: 'Mobile App Development',
      description: 'Develop a mobile application for real-time analytics monitoring.',
      progress: 90,
      teamMembers: [
        { id: '7', name: 'David Lee', initials: 'DL' },
        { id: '8', name: 'Lisa Chen', initials: 'LC' },
        { id: '9', name: 'Tom Anderson', initials: 'TA' }
      ],
      taskCount: 15,
      completedTasks: 14,
      dueDate: new Date('2024-01-30'),
      status: 'completed'
    }
  ];

  const displayProjects = projects.length > 0 ? projects : mockProjects;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Current Projects</h2>
          <p className="text-gray-600 mt-1">Track your team's progress and manage project workflows</p>
        </div>
        <Button onClick={onCreateProject} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Board</span>
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <ProjectCard
              key={index}
              id={`loading-${index}`}
              name=""
              description=""
              progress={0}
              teamMembers={[]}
              taskCount={0}
              completedTasks={0}
              dueDate={new Date()}
              status="active"
              loading={true}
            />
          ))
        ) : (
          displayProjects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
            />
          ))
        )}
      </div>

      {/* Additional Projects Quick List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Kanban className="w-5 h-5 mr-2" />
            Additional Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'API Integration', progress: 30, status: 'active' },
              { name: 'Security Audit', progress: 60, status: 'active' },
              { name: 'Performance Testing', progress: 20, status: 'on-hold' },
              { name: 'Documentation Update', progress: 85, status: 'active' }
            ].map((project, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'active' ? 'text-blue-600 bg-blue-50' :
                    project.status === 'on-hold' ? 'text-yellow-600 bg-yellow-50' :
                    'text-gray-600 bg-gray-50'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectManagementSection; 