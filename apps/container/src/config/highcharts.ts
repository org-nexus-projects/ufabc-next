import Highcharts from 'highcharts';

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
