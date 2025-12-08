# Image Optimization Guide

## Current State

The website currently uses emoji icons (🔗, 🤖, 🍯, ⛓️, 👨‍💻, 🏛️, 🏢) which don't require optimization.

## Future Image Optimization

When adding images to the website, follow these guidelines:

### 1. Image Formats

- Use **WebP** format with JPEG/PNG fallback
- Use **SVG** for logos and icons
- Compress images to < 100KB each

### 2. Responsive Images

Use the `srcset` attribute for responsive images:

```html
<img
  src="image-800w.webp"
  srcset="
    image-400w.webp 400w,
    image-800w.webp 800w,
    image-1200w.webp 1200w
  "
  sizes="(max-width: 768px) 100vw, 800px"
  alt="Description"
/>
```

### 3. Lazy Loading

Add `loading="lazy"` to images below the fold:

```html
<img src="image.webp" alt="Description" loading="lazy" />
```

### 4. Image Optimization Tools

- **Sharp** - Node.js image processing
- **ImageOptim** - macOS image compression
- **Squoosh** - Web-based image compression
- **TinyPNG** - PNG/JPEG compression

### 5. Build Process

Add image optimization to the build process:

```bash
npm install -D vite-plugin-imagemin
```

Update `vite.config.ts`:

```typescript
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    react(),
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9], speed: 4 },
      svgo: {
        plugins: [
          { name: 'removeViewBox' },
          { name: 'removeEmptyAttrs', active: false },
        ],
      },
    }),
  ],
});
```

### 6. CDN Delivery

For production, serve images from a CDN:

- Netlify Image CDN
- Cloudinary
- imgix
- AWS CloudFront

### 7. Performance Targets

- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Total image size < 500KB per page
