import Highcharts from 'highcharts';

const darkMode = {
  chart: {
    backgroundColor: '#212121',
  },
  credits: {
    style: {
      color: '#1f1f1f',
    },
  },
  legend: {
    itemHoverStyle: {
      color: '#FFF',
    },
    itemStyle: {
      color: '#E0E0E3',
    },
  },
  title: {
    style: {
      color: '#E0E0E3',
    },
  },
  xAxis: {
    labels: {
      style: {
        color: '#E0E0E3',
      },
    },
    title: {
      style: {
        color: '#E0E0E3',
      },
    },
  },
  yAxis: {
    labels: {
      style: {
        color: '#E0E0E3',
      },
    },
    title: {
      style: {
        color: '#E0E0E3',
      },
    },
  },
};

const lightMode = {
  chart: {
    backgroundColor: '#ffffff',
  },
  credits: {
    style: {
      color: '#ffffff',
    },
  },
  legend: {
    itemHoverStyle: {
      color: '#000000',
    },
    itemStyle: {
      color: '#333333',
    },
  },
  title: {
    style: {
      color: '#333333',
    },
  },
  xAxis: {
    labels: {
      style: {
        color: '#333333',
      },
    },
    title: {
      style: {
        color: '#333333',
      },
    },
  },
  yAxis: {
    labels: {
      style: {
        color: '#333333',
      },
    },
    title: {
      style: {
        color: '#333333',
      },
    },
  },
};

export function applyChartsTheme() {
  const isDarkMode = document.body.classList.contains('highcharts-dark');
  Highcharts.setOptions(isDarkMode ? darkMode : lightMode);
}
