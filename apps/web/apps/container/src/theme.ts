import type { ThemeDefinition } from 'vuetify';

export const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    navigation: '#215096',
    primary: '#2e7eed',
    secondary: '#f3f6f7',
    'ufabcnext-green': '#37bba3',
    'next-gray': '#404040',
    'next-light-gray': '#848687',
    'ufabcnext-yellow': '#FFCB17',
    'ufabcnext-red': '#E17472',
    error: '#f45576',
    background: '#ffffff',
    surface: '#FFFFFF',
    appbar: '#F5F5F5'
  },
};

export const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    navigation: '#0a2771',
    primary: '#2e7eed',
    secondary: '#121212',
    'ufabcnext-green': '#37bba3',
    'next-gray': '#404040',
    'next-light-gray': '#848687',
    'ufabcnext-yellow': '#FFCB17',
    'ufabcnext-red': '#E17472',
    error: '#f45576',
    background: '#121212',
    surface: '#212121',
    appbar: '#161616'
  },
};