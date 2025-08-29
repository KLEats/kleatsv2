/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' http://188.245.112.188:3000; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval';",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/roles",
        destination: "https://forms.gle/7BrnhSxBZupUoR617",
        permanent: true,
      },
      {
        source: "/roles/",
        destination: "https://forms.gle/7BrnhSxBZupUoR617",
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Ensure webhook POSTs to /telegram/ are served by the API route at /telegram without redirects
        { source: "/telegram/", destination: "/telegram" },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "188.245.112.188",
        port: "3000",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
