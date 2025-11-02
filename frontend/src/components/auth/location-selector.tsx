"use client";

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin } from 'lucide-react';
import axios from '@/lib/axios';

interface Location {
  uuid: string;
  display: string;
  name: string;
  description?: string;
  parentLocation?: {
    uuid: string;
    display: string;
  };
  tags: Array<{
    uuid: string;
    display: string;
  }>;
}

interface LocationSelectorProps {
  value?: string;
  onChange: (locationUuid: string, location: Location) => void;
  error?: string;
}

// Fetch locations with LOGIN_LOCATION tag
async function fetchLoginLocations(): Promise<Location[]> {
  try {
    // Try to fetch locations with LOGIN_LOCATION tag
    const response = await axios.get('/location', {
      params: {
        tag: 'Login Location',
        v: 'full',
      },
    });
    
    const locations = response.data?.results || [];
    
    // If no tagged locations, fall back to fetching queue rooms
    if (locations.length === 0) {
      const fallbackResponse = await axios.get('/location', {
        params: {
          tag: 'Queue Room',
          v: 'full',
        },
      });
      return fallbackResponse.data?.results || [];
    }
    
    return locations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    // Return default locations if API fails
    return [
      {
        uuid: 'default-reception',
        display: 'Reception',
        name: 'Reception',
        description: 'Default reception area',
        tags: [],
      },
      {
        uuid: 'default-triage',
        display: 'Triage',
        name: 'Triage',
        description: 'Default triage area',
        tags: [],
      },
      {
        uuid: 'default-opd',
        display: 'OPD Room 1',
        name: 'OPD Room 1',
        description: 'Default consultation room',
        tags: [],
      },
    ];
  }
}

export function LocationSelector({ value, onChange, error }: LocationSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(value);
  
  const { data: locations = [], isLoading, error: queryError } = useQuery({
    queryKey: ['login-locations'],
    queryFn: fetchLoginLocations,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update parent when selection changes
  const handleLocationChange = (locationUuid: string) => {
    setSelectedLocation(locationUuid);
    const location = locations.find(loc => loc.uuid === locationUuid);
    if (location) {
      onChange(locationUuid, location);
    }
  };

  // Auto-select first location if only one available
  useEffect(() => {
    if (locations.length === 1 && !selectedLocation) {
      handleLocationChange(locations[0].uuid);
    }
  }, [locations, selectedLocation]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Work Location</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (queryError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load locations. Using default locations.
        </AlertDescription>
      </Alert>
    );
  }

  if (locations.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No login locations configured. Contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="location" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Work Location *
      </Label>
      <Select value={selectedLocation} onValueChange={handleLocationChange}>
        <SelectTrigger id="location" className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="Select your work location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location.uuid} value={location.uuid}>
              <div className="flex flex-col">
                <span className="font-medium">{location.display}</span>
                {location.parentLocation && (
                  <span className="text-xs text-muted-foreground">
                    {location.parentLocation.display}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {locations.length === 1 && (
        <p className="text-xs text-muted-foreground">
          Only one location available - automatically selected
        </p>
      )}
    </div>
  );
}
