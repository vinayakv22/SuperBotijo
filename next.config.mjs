/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests from local network IPs
  allowedDevOrigins: [
    "100.84.105.74",
    "localhost",
  ],
};

export default nextConfig;
