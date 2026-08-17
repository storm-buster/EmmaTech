import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// jsdom test-environment polyfills.
// These live ONLY in the shared Vitest setup; no production component is
// changed. They provide browser APIs that jsdom omits but that our UI
// libraries (framer-motion, focus-trap-react/tabbable) require on mount.
// ---------------------------------------------------------------------------

// RC-001 — jsdom does not implement IntersectionObserver, which framer-motion's
// viewport feature ("whileInView") calls on mount, throwing
// "ReferenceError: IntersectionObserver is not defined". Provide a no-op stub
// exposing the full IntersectionObserver surface (observe/unobserve/
// disconnect/takeRecords).
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [];
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
if (typeof window !== 'undefined') {
  (window as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

// RC-002 — focus-trap-react relies on `tabbable`, whose default
// displayCheck ('full') treats a node as visible only when getClientRects()
// is non-empty. jsdom returns an empty list for every element, so the modal's
// focus trap finds no tabbable node and throws "Your focus-trap must have at
// least one container with at least one tabbable node in it at all times".
// Return a minimal non-empty rect for connected elements so tabbable can
// detect the modal's real focusable nodes (e.g. the close button). This does
// not weaken any assertion; it only lets jsdom report elements as displayed.
if (typeof Element !== 'undefined') {
  const stubRect: DOMRect = {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    top: 0,
    left: 0,
    right: 1,
    bottom: 1,
    toJSON() {
      return {};
    },
  };
  const originalGetClientRects = Element.prototype.getClientRects;
  Element.prototype.getClientRects = function getClientRects(this: Element): DOMRectList {
    if (this.isConnected) {
      return [stubRect] as unknown as DOMRectList;
    }
    return originalGetClientRects.call(this);
  };
}
