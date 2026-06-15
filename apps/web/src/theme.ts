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

const darkMode = {
  chart: {
    backgroundColor: '#212121',
  },
  title: {
    style: {
      color: '#E0E0E3',
    },
  },
  yAxis: {
    title: {
      style: {
        color: '#E0E0E3',
      },
    },
    labels: {
      style: {
        color: '#E0E0E3',
      },
    },
  },
  xAxis: {
    title: {
      style: {
        color: '#E0E0E3',
      },
    },
    labels: {
      style: {
        color: '#E0E0E3',
      },
    },
  },
  legend: {
    itemStyle: {
      color: '#E0E0E3',
    },
    itemHoverStyle: {
      color: '#FFF',
    },
  },
  credits: {
    style: {
      color: '#1f1f1f',
    },
  },
};

const lightMode = {
  chart: {
    backgroundColor: '#ffffff',
  },
  title: {
    style: {
      color: '#333333',
    },
  },
  yAxis: {
    title: {
      style: {
        color: '#333333',
      },
    },
    labels: {
      style: {
        color: '#333333',
      },
    },
  },
  xAxis: {
    title: {
      style: {
        color: '#333333',
      },
    },
    labels: {
      style: {
        color: '#333333',
      },
    },
  },
  legend: {
    itemStyle: {
      color: '#333333',
    },
    itemHoverStyle: {
      color: '#000000',
    },
  },
  credits: {
    style: {
      color: '#ffffff',
    },
  },
};

export function applyChartsTheme() {
  const isDarkMode = document.body.classList.contains('highcharts-dark');
  Highcharts.setOptions(isDarkMode ? darkMode : lightMode);
}