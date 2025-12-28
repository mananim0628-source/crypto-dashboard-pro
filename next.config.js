/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lpdhtagnbqwjagtmifug.supabase.co'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://lpdhtagnbqwjagtmifug.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZGh0YWduYnF3amFndG1pZnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDQwNTYsImV4cCI6MjA4MjUyMDA1Nn0.DI-u8boNnF7tChjNslEHdI0S9dngIFW07x9qrOnbIQo',
  },
}

module.exports = nextConfig
