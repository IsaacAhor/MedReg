"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  params: { uuid: string };
}

export default function RegistrationSuccessPage({ params }: Props) {
  const search = useSearchParams();
  const folder = search.get("folder") || "";
  const { uuid } = params;

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-2">Registration Successful</h1>
      <p className="text-muted-foreground mb-6">Patient has been registered.</p>

      <div className="rounded-md border p-4 mb-6">
        <div className="text-sm text-muted-foreground">Folder Number</div>
        <div className="text-xl font-medium">{folder || "Unavailable"}</div>
      </div>

      <div className="flex gap-3">
        <Link href={`/patients/${uuid}`}>
          <Button>View Patient</Button>
        </Link>
        <Link href="/patients/register">
          <Button variant="outline">Register Another</Button>
        </Link>
      </div>
    </div>
  );
}

