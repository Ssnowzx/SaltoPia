import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * The optimiser re-encodes, so a page image is compressed twice. At the default 75
     * the second pass mushed the photographs into something that looked shot on an old
     * phone; these are the levels the pages actually ask for.
     */
    qualities: [75, 88, 90],
  },
};

export default nextConfig;
