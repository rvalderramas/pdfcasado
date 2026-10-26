// Miniaturas das páginas originais, renderizadas sob demanda com pdf.js.
// Guarda só as mais recentes para não esgotar a memória em PDFs longos.

const LONG_SIDE_PX = 720;
const MAX_CACHED = 48;

export class ThumbnailCache {
  constructor(viewer, onReady) {
    this.viewer = viewer;
    this.onReady = onReady;
    this.cache = new Map();
    this.queue = [];
    this.running = false;
  }

  get(index) {
    if (this.cache.has(index)) {
      const canvas = this.cache.get(index);
      this.cache.delete(index);
      this.cache.set(index, canvas);
      return canvas;
    }
    if (!this.queue.includes(index)) this.queue.push(index);
    this.#drain();
    return null;
  }

  async #drain() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      const index = this.queue.shift();
      if (this.cache.has(index)) continue;
      this.#store(index, await this.#render(index));
      this.onReady();
    }
    this.running = false;
  }

  async #render(index) {
    const page = await this.viewer.getPage(index + 1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: LONG_SIDE_PX / Math.max(base.width, base.height) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    return canvas;
  }

  #store(index, canvas) {
    this.cache.set(index, canvas);
    if (this.cache.size > MAX_CACHED) this.cache.delete(this.cache.keys().next().value);
  }
}
