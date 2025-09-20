import { useEffect, useState } from 'react';

export function useSpecialLocations() {
  const [specialLocations, setSpecialLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSpecialLocations() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/academic/special-locations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch special locations');
        }
        
        const data = await response.json();
        setSpecialLocations(data.data || []);
      } catch (err) {
        console.error('Error fetching special locations:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSpecialLocations();
  }, []);

  return { specialLocations, isLoading, error };
}