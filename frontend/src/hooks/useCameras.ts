import { useState, useEffect } from 'react';

interface UseCamerasReturn {
  cameras: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCameras = (): UseCamerasReturn => {
  const [cameras, setCameras] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/analytics/cameras');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setCameras(result.cameras || []);
    } catch (err) {
      console.error('Error fetching cameras:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cameras');
      setCameras([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch cameras on mount
  useEffect(() => {
    fetchCameras();
  }, []);

  const refetch = () => {
    fetchCameras();
  };

  return {
    cameras,
    isLoading,
    error,
    refetch
  };
}; 