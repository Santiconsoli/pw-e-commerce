/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true
      },
      {
        source: '/checkout.html',
        destination: '/checkout',
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
