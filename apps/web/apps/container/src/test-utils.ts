import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { render, screen, waitFor, within } from '@testing-library/vue';
import elementPlus from 'element-plus';
import { Plugin } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export { default as userEvent } from '@testing-library/user-event';

const vuetify = createVuetify({
  components,
  directives,
});

export const defaultPlugins: (Plugin | [Plugin, ...unknown[]])[] = [
  vuetify,
  elementPlus,
  [
    VueQueryPlugin,
    {
      queryClient: new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
    },
  ],
];

const customRender: typeof render = (component, options) => {
  return render(component, {
    ...options,
    global: {
      plugins: defaultPlugins,
      ...options?.global,
    },
  });
};

export { customRender as render };
export * from '@testing-library/vue';

export const expectToasterToHaveText = async (text: string) => {
  await waitFor(() => {
    expect(
      within(screen.getAllByRole('alert').at(-1)!).getByText(RegExp(text, 'i')),
    ).toBeInTheDocument();
  });
};
