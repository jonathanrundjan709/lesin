/** Next.js hanya melayani API (src/app/api). UI statis ada di public/ dan disajikan di "/". */
export default {
  reactStrictMode: true,
  // Driver Postgres memakai API Node, jadi jangan di-bundle oleh Next.
  serverExternalPackages: ["pg"],
  // URL bersih tanpa "#": "/" dan semua path non-API (/results, /tutor/abc, ...) menyajikan aplikasi yang sama.
  // "fallback" dijalankan setelah semua rute (termasuk /api/...) dan berkas public/ dicek, jadi tidak menimpa keduanya.
  async rewrites() {
    return {
      afterFiles: [{ source: "/", destination: "/index.html" }],
      fallback: [{ source: "/:path((?!api/|_next/).*)", destination: "/index.html" }],
    };
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
