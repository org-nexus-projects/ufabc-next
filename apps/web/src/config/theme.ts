import type { ThemeDefinition } from 'vuetify';

export const lightTheme: ThemeDefinition = {
  colors: {
    appbar: '#ffffff',
    background: '#F5F5F5',
    error: '#f45576',
    navigation: '#215096',
    'next-gray': '#404040',
    'next-light-gray': '#848687',
    primary: '#2e7eed',
    secondary: '#f3f6f7',
    surface: '#ffffff',
    text: '#000000',
    'ufabcnext-green': '#37bba3',
    'ufabcnext-red': '#E17472',
    'ufabcnext-yellow': '#FFCB17',
  },
  dark: false,
};

export const darkTheme: ThemeDefinition = {
  colors: {
    appbar: '#161616',
    background: '#121212',
    error: '#f45576',
    navigation: '#0a2771',
    'next-gray': '#404040',
    'next-light-gray': '#848687',
    primary: '#2e7eed',
    secondary: '#121212',
    surface: '#212121',
    text: '#FFFFFF',
    'ufabcnext-green': '#37bba3',
    'ufabcnext-red': '#E17472',
    'ufabcnext-yellow': '#FFCB17',
  },
  dark: true,
};
