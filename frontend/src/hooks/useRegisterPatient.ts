import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { toast } from "sonner";

export interface RegisterPatientPayload {
  ghanaCard: string;
  nhisNumber?: string;
  givenName: string;
  middleName?: string;
  familyName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: "M" | "F" | "O";
  phone: string;
  region?: string;
  regionCode?: string;
  city?: string;
  address?: string;
}

export function useRegisterPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RegisterPatientPayload) => {
      // Call Next.js API route (BFF pattern)
      const res = await axios.post("/patients", payload);
      return res.data;
    },
    onSuccess: (data: any) => {
      const folder = data?.patient?.folderNumber;
      if (folder) {
        toast.success(`Patient registered. Folder: ${folder}`);
      } else {
        toast.success("Patient registered successfully");
      }
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.response?.data?.message || "Failed to register patient";
      toast.error(msg);
    },
  });
}
