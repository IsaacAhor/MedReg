"use client";

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLogin } from '@/hooks/useAuth';
import { LocationSelector } from './location-selector';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  locationUuid: z.string().min(1, 'Work location is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const [locationError, setLocationError] = useState<string | undefined>();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { 
      username: '', 
      password: '',
      locationUuid: '',
    },
  });

  const login = useLogin();

  const onSubmit = async (values: FormValues) => {
    if (!values.locationUuid) {
      setLocationError('Please select your work location');
      return;
    }
    setLocationError(undefined);
    await login.mutateAsync({
      username: values.username,
      password: values.password,
      location: values.locationUuid,
    });
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <Form {...(form as any)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="admin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <LocationSelector 
            value={form.watch('locationUuid')}
            onChange={(locationUuid) => {
              form.setValue('locationUuid', locationUuid);
              setLocationError(undefined);
            }}
            error={locationError || form.formState.errors.locationUuid?.message}
          />

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </Form>
    </div>
  );
}


