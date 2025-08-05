import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { MoreHorizontal, Users, Calendar, CheckCircle } from 'lucide-react';

interface ProjectMember {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
}

interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  progress: number;
  teamMembers: ProjectMember[];
  taskCount: number;
  completedTasks: number;
  dueDate: Date;
  status: 'active' | 'completed' | 'on-hold';
  loading?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  name,
  description,
  progress,
  teamMembers,
  taskCount,
  completedTasks,
  dueDate,
  status,
  loading = false
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'on-hold':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-blue-600 rounded-full" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'on-hold':
        return <div className="w-2 h-2 bg-yellow-600 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-600 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <Card className="h-48">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-2 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-48 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 truncate">
            {name}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              <div className="flex items-center space-x-1">
                {getStatusIcon()}
                <span className="capitalize">{status}</span>
              </div>
            </span>
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">
          {description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{teamMembers.length} members</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4" />
            <span>{completedTasks}/{taskCount} tasks</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {teamMembers.slice(0, 3).map((member, index) => (
              <Avatar key={member.id} className="w-8 h-8 border-2 border-white">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {teamMembers.length > 3 && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-xs text-gray-600">+{teamMembers.length - 3}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{dueDate.toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard; 