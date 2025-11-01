/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Important: We intentionally do NOT rewrite `/api/*` to OpenMRS.
  // All browser calls must go through Next.js route handlers (BFF)
  // which manage the OpenMRS session and enforce security.
};

export default nextConfig;
