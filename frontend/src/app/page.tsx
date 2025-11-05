import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function HomePage() {
  const sessionCookie = cookies().get('omrsSession');

  if (sessionCookie) {
    // User is authenticated → Go to dashboard
    redirect('/dashboard');
  } else {
    // User not authenticated → Go to login
    redirect('/login');
  }
}
