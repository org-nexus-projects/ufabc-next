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

window.ResizeObserver = window.ResizeObserver || ResizeObserverStub;

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
