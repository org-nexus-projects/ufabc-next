import '@testing-library/jest-dom/vitest';

import { server } from '@/mocks/server';

class ResizeObserverStub {
  observe() {
    // do nothing
  }
  unobserve() {
    // do nothing
  }
  disconnect() {
    // do nothing
  }
}

// todo: check this later
class VisualViewportStub {
  height = 768;
  width = 1024;
  offsetLeft = 0;
  offsetTop = 0;
  pageLeft = 0;
  pageTop = 0;
  scale = 1;
  addEventListener() {
    // do nothing
  }
  removeEventListener() {
    // do nothing
  }
  dispatchEvent() {
    return true;
  }
}

window.ResizeObserver = window.ResizeObserver || ResizeObserverStub;
window.visualViewport =
  window.visualViewport ||
  (new VisualViewportStub() as unknown as VisualViewport);

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
