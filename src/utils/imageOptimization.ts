// Image optimization utilities

/**
 * Generate srcset for responsive images
 * @param imagePath - Base path to the image
 * @param sizes - Array of widths for responsive images
 * @returns srcset string
 */
export function generateSrcSet(imagePath: string, sizes: number[]): string {
  return sizes
    .map((size) => {
      const extension = imagePath.split('.').pop();
      const basePath = imagePath.replace(`.${extension}`, '');
      return `${basePath}-${size}w.${extension} ${size}w`;
    })
    .join(', ');
}

/**
 * Lazy load images using Intersection Observer
 * @param imageElement - Image element to lazy load
 */
export function lazyLoadImage(imageElement: HTMLImageElement): void {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    imageObserver.observe(imageElement);
  } else {
    // Fallback for browsers without Intersection Observer
    if (imageElement.dataset.src) {
      imageElement.src = imageElement.dataset.src;
    }
    if (imageElement.dataset.srcset) {
      imageElement.srcset = imageElement.dataset.srcset;
    }
  }
}

/**
 * Preload critical images
 * @param imageUrls - Array of image URLs to preload
 */
export function preloadImages(imageUrls: string[]): void {
  imageUrls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}
