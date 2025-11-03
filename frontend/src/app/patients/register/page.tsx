"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterPatient } from "@/hooks/useRegisterPatient";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Ghana Card checksum (Luhn) as per AGENTS.md
function validateGhanaCardChecksum(ghanaCard: string): boolean {
  const digits = ghanaCard.replace(/[^0-9]/g, "");
  if (digits.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = Number(digits[i]);
    if (i % 2 === 0) d *= 2;
    if (d > 9) d -= 9;
    sum += d;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(digits[9]);
}

// Regions (code → label) - 16 regions per AGENTS.md
const GH_REGIONS: { code: string; name: string }[] = [
  { code: 'AR', name: 'Ashanti' },
  { code: 'BER', name: 'Bono East' },
  { code: 'BR', name: 'Bono' },
  { code: 'CR', name: 'Central' },
  { code: 'ER', name: 'Eastern' },
  { code: 'GAR', name: 'Greater Accra' },
  { code: 'NER', name: 'North East' },
  { code: 'NR', name: 'Northern' },
  { code: 'NWR', name: 'North West' },
  { code: 'OR', name: 'Oti' },
  { code: 'SR', name: 'Savannah' },
  { code: 'UER', name: 'Upper East' },
  { code: 'UWR', name: 'Upper West' },
  { code: 'VR', name: 'Volta' },
  { code: 'WR', name: 'Western' },
  { code: 'WNR', name: 'Western North' },
];

// Zod schema
const formSchema = z
  .object({
    ghanaCard: z
      .string()
      .min(1, "Ghana Card is required")
      .transform((s) => s.trim().toUpperCase())
      .refine((s) => /^GHA-\d{9}-\d$/.test(s), {
        message: "Invalid Ghana Card format (GHA-XXXXXXXXX-X)",
      })
      .refine((s) => validateGhanaCardChecksum(s), {
        message: "Invalid Ghana Card checksum",
      }),
    nhisNumber: z
      .string()
      .optional()
      .transform((s) => (s ? s.replace(/[\s-]/g, "") : s))
      .refine((s) => !s || /^\d{10}$/.test(s), {
        message: "NHIS number must be 10 digits",
      }),
    givenName: z.string().min(2, "Given name is required"),
    middleName: z.string().optional(),
    familyName: z.string().min(2, "Family name is required"),
    dateOfBirth: z.coerce.date().max(new Date(), { message: "DOB cannot be in the future" }),
    gender: z.enum(["M", "F", "O"], { required_error: "Gender is required" }),
    phone: z
      .string()
      .transform((s) => s.trim())
      .refine((s) => /^\+233\d{9}$/.test(s), {
        message: "Phone must be in +233XXXXXXXXX format",
      }),
    regionCode: z.string().optional(),
    district: z.string().optional(),
    town: z.string().optional(),
    street: z.string().optional(),
  })
  .strict();

type FormValues = z.infer<typeof formSchema>;

export default function PatientRegistrationPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      ghanaCard: "",
      nhisNumber: "",
      givenName: "",
      middleName: "",
      familyName: "",
      // keep phone prefix to guide user
      phone: "+233",
      gender: undefined as unknown as "M" | "F" | "O",
      regionCode: "GAR",
      district: "",
      town: "",
      street: "",
    },
  });

  const mutation = useRegisterPatient();

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      ghanaCard: values.ghanaCard,
      nhisNumber: values.nhisNumber || undefined,
      givenName: values.givenName,
      middleName: values.middleName || undefined,
      familyName: values.familyName,
      dateOfBirth: values.dateOfBirth.toISOString().substring(0, 10),
      gender: values.gender,
      phone: values.phone,
      region: undefined,
      regionCode: values.regionCode,
      city: values.town,
      address: [values.street, values.district, values.town].filter(Boolean).join(", "),
    }, {
      onSuccess: (data: any) => {
        const uuid = data?.patient?.uuid || data?.uuid;
        const folder = data?.patient?.folderNumber;
        const nhieSync = data?.patient?.nhieSync;
        if (uuid) {
          const params = new URLSearchParams();
          if (folder) params.set("folder", folder);
          if (nhieSync) params.set("nhieSync", nhieSync);
          const qs = params.toString() ? `?${params.toString()}` : "";
          router.push(`/patients/${uuid}/success${qs}`);
        }
      },
    });
  };

  // phone input helper: keep +233 prefix and digits only afterward
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (v: string) => void) => {
    let v = e.target.value;
    if (!v.startsWith("+233")) v = "+233" + v.replace(/[^\d]/g, "");
    v = "+233" + v.replace(/^\+233/, "").replace(/[^\d]/g, "").slice(0, 9);
    onChange(v);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Patient Registration</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="ghanaCard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghana Card *</FormLabel>
                  <FormControl>
                    <Input placeholder="GHA-123456789-7" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nhisNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NHIS Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="givenName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Given Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Kwame" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="familyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Family Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mensah" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Kofi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+233XXXXXXXXX"
                      value={field.value || "+233"}
                      onChange={(e) => handlePhoneChange(e, field.onChange)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="regionCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GH_REGIONS.map((r) => (
                        <SelectItem key={r.code} value={r.code}>
                          {r.name} ({r.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                  <FormControl>
                    <Input placeholder="Accra Metro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="town"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Town/City</FormLabel>
                  <FormControl>
                    <Input placeholder="Accra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Registering..." : "Register Patient"}
            </Button>
            {/* Errors shown via toast; keep page minimal */}
          </div>
        </form>
      </Form>
    </div>
  );
}
