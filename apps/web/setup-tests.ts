import '@testing-library/jest-dom/vitest';
import { server } from '@/mocks/server';

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

class VisualViewportStub {
  height = 768;
  width = 1024;
  offsetLeft = 0;
  offsetTop = 0;
  pageLeft = 0;
  pageTop = 0;
  scale = 1;
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn(() => true);
}

window.ResizeObserver ??= ResizeObserverStub;
if (window.visualViewport == null) {
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: new VisualViewportStub(),
    writable: true,
  });
}

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
