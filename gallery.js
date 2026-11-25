export function initScreenshotGalleries(root = document) {
  root.querySelectorAll('[data-screenshot-gallery]').forEach(gallery => {
    const track = gallery.querySelector('[data-gallery-track]');
    if (!track) return;
    gallery.querySelectorAll('[data-gallery-direction]').forEach(button => {
      button.addEventListener('click', () => {
        track.scrollBy({
          left: track.clientWidth * Number(button.dataset.galleryDirection) * 0.85,
          behavior: 'smooth'
        });
      });
    });
  });
}
