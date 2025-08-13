import { useState, useEffect } from 'react';

export type CameraOption = { value: string; label: string; store?: string };

interface UseCamerasParams {
	department?: string;
	store?: string;
}

interface UseCamerasReturn {
	cameras: CameraOption[];
	isLoading: boolean;
	error: string | null;
	refetch: () => void;
}

export const useCameras = ({ department, store }: UseCamerasParams = {}): UseCamerasReturn => {
	const [cameras, setCameras] = useState<CameraOption[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchCameras = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams();
			if (department) params.append('department', department);
			if (store) params.append('store', store);
			const qs = params.toString() ? `?${params.toString()}` : '';
			const response = await fetch(`/api/v1/analytics/filters/cameras${qs}`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const result = await response.json();
			// result.items may be array of strings (legacy) or array of {camera, store}
			const items = (result.items || []) as Array<string | { camera: string; store?: string }>;
			const mapped: CameraOption[] = items
				.map((it) => {
					if (typeof it === 'string') {
						return { value: it, label: store ? it : `${it}`, store: undefined };
					}
					const cam = it.camera;
					const grp = it.store;
					return { value: cam, label: store ? cam : `${cam} (${grp || 'Unknown'})`, store: grp };
				})
				.filter((opt) => !!opt.value);
			setCameras(mapped);
		} catch (err) {
			console.error('Error fetching cameras:', err);
			setError(err instanceof Error ? err.message : 'Failed to fetch cameras');
			setCameras([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCameras();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [department, store]);

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