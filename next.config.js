/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    loader: "custom",
    loaderFile: './my/image/loader.js',
    formats: ["image/avif", "image/webp"],
  },
};
