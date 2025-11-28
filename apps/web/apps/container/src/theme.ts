import Highcharts from 'highcharts';
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
    background: '#F5F5F5',
    surface: '#ffffff',
    appbar: '#ffffff',
    text: '#000000',
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
    appbar: '#161616',
    text: '#FFFFFF',
  },
};

export function applyChartsTheme() {
  const isDarkMode = document.body.classList.contains('highcharts-dark');

  Highcharts.setOptions({
    chart: {
      backgroundColor: isDarkMode ? '#212121' : '#ffffff',
    },
    title: {
      style: {
        color: isDarkMode ? '#E0E0E3' : '#333333',
      },
    },
    yAxis: {
      title: {
        style: {
          color: isDarkMode ? '#E0E0E3' : '#333333',
        },
      },
      labels: {
        style: {
          color: isDarkMode ? '#E0E0E3' : '#333333',
        },
      },
    },
    xAxis: {
      title: {
        style: {
          color: isDarkMode ? '#E0E0E3' : '#333333',
        },
      },
      labels: {
        style: {
          color: isDarkMode ? '#E0E0E3' : '#333333',
        },
      },
    },
    legend: {
      itemStyle: {
        color: isDarkMode ? '#E0E0E3' : '#333333',
      },
      itemHoverStyle: {
        color: isDarkMode ? '#FFF' : '#000000',
      },
    },
    credits: {
      style: {
        color: isDarkMode ? '#1f1f1f' : '#ffffff',
      },
    },
  });
}