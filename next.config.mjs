/** Next.js hanya melayani API (src/app/api). UI statis ada di public/ dan disajikan di "/". */
export default {
  reactStrictMode: true,
  // Driver Postgres memakai API Node, jadi jangan di-bundle oleh Next.
  serverExternalPackages: ["pg"],
  async rewrites() {
    return [{ source: "/", destination: "/index.html" }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
      ] },
      // Berkas UI selalu diperiksa ulang supaya perubahan langsung terlihat setelah refresh.
      { source: "/:path(js|css)/:rest*", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};
