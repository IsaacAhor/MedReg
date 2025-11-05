"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface PatientSearchResult {
  uuid: string;
  display: string;
  identifiers: Array<{
    identifier: string;
    identifierType: { display: string };
  }>;
}

export function PatientSearchHeader() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const { data: patients, isLoading } = useQuery<PatientSearchResult[]>({
    queryKey: ['patientSearch', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await fetch(`/api/patients?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search patients');
      const data = await response.json();
      return data.results || [];
    },
    enabled: query.length >= 2,
  });

  const selectPatient = (patientUuid: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/patients/${patientUuid}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-64 justify-start text-left font-normal">
          <Search className="mr-2 h-4 w-4" />
          <span className="text-gray-500">Search patients...</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Ghana Card, Folder #, or Name"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading && <div className="p-4 text-sm text-gray-500">Searching...</div>}
            {!isLoading && query.length >= 2 && patients?.length === 0 && (
              <CommandEmpty>No patients found.</CommandEmpty>
            )}
            <CommandGroup>
              {patients?.map((patient) => {
                const ghanaCard = patient.identifiers.find(id =>
                  id.identifierType.display.toLowerCase().includes('ghana card')
                )?.identifier;
                const folderNumber = patient.identifiers.find(id =>
                  id.identifierType.display.toLowerCase().includes('folder')
                )?.identifier;

                return (
                  <CommandItem
                    key={patient.uuid}
                    onSelect={() => selectPatient(patient.uuid)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{patient.display}</span>
                      <span className="text-xs text-gray-500">
                        {folderNumber && `Folder: ${folderNumber}`}
                        {ghanaCard && ` • Ghana Card: ${ghanaCard.slice(0, 8)}...`}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
