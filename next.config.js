const withPWA = require("next-pwa")({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    // Silence Turbopack warning as we rely on Webpack only for PWA (disabled in dev)
    // or just to acknowledge we have webpack config.
    // Silence Turbopack warning
    turbopack: {

    }
};

module.exports = withPWA(nextConfig);
