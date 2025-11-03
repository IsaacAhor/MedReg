"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus } from "lucide-react";
import { usePatients } from "@/hooks/usePatients";
import { useSession } from "@/hooks/useAuth";
import { maskGhanaCard } from "@/lib/validators/ghana-card";

export default function PatientsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params?.get("q") || "";

  const [searchQuery, setSearchQuery] = useState<string>(initialQ);

  // Auth check using TanStack Query
  const { data: session, isLoading: sessionLoading } = useSession();

  // Patients data using TanStack Query
  const { data: patientsData, isLoading: patientsLoading, refetch } = usePatients(searchQuery);

  const loading = sessionLoading || patientsLoading;

  const rows = useMemo(() => {
    const patients = patientsData?.results || [];
    return patients.map((p) => {
      const ghCard = (p.identifiers || []).find((id) =>
        (id.identifierType?.display || "").toLowerCase().includes("ghana card")
      );
      return {
        uuid: p.uuid,
        name: p.display,
        ghanaCard: ghCard?.identifier || "N/A",
        gender: p.person?.gender || "-",
        age: typeof p.person?.age === "number" ? String(p.person?.age) : "-",
      };
    });
  }, [patientsData]);

  // Redirect to login if not authenticated
  if (!sessionLoading && !session?.authenticated) {
    router.push("/login");
    return null;
  }

  const onSearch = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Patient List</h1>
          <Button onClick={() => router.push("/patients/register")}>
            <Plus className="mr-2 h-4 w-4" /> Register Patient
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Patients</CardTitle>
            <CardDescription>Search and view patient records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                  }}
                  className="pl-10"
                  placeholder="Search name, Ghana Card, NHIS…"
                  aria-label="Search patients"
                />
              </div>
              <Button variant="outline" onClick={onSearch} aria-label="Search">
                Search
              </Button>
              <Button variant="outline" onClick={() => refetch()} aria-label="Refresh">
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading patients…</div>
            ) : rows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No patients found.{' '}
                <Button variant="link" onClick={() => router.push('/patients/register')}>
                  Register first patient
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Ghana Card</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.uuid} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{maskGhanaCard(r.ghanaCard)}</TableCell>
                      <TableCell>{r.gender}</TableCell>
                      <TableCell>{r.age}</TableCell>
                      <TableCell>
                        <Button variant="link" onClick={() => router.push(`/patients/${r.uuid}`)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
