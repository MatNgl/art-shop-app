import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexStroke,
  ApexGrid,
  ApexTooltip,
  ApexLegend,
  ApexPlotOptions,
  ApexFill,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexTheme,
  ApexAnnotations,
  ApexMarkers,
} from 'ng-apexcharts';

export interface ChartOptions {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis | ApexYAxis[];
  dataLabels?: ApexDataLabels;
  stroke?: ApexStroke;
  grid?: ApexGrid;
  tooltip?: ApexTooltip;
  legend?: ApexLegend;
  plotOptions?: ApexPlotOptions;
  fill?: ApexFill;
  responsive?: ApexResponsive[];
  labels?: string[];
  colors?: string[];
  theme?: ApexTheme;
  annotations?: ApexAnnotations;
  markers?: ApexMarkers;
}

export const CHART_COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  gray: '#6b7280',
};

export const apexChartBaseOptions: Partial<ChartOptions> = {
  chart: {
    type: 'line',
    fontFamily: 'Inter, system-ui, sans-serif',
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true,
      },
    },
    animations: {
      enabled: true,
      speed: 800,
    },
  },
  grid: {
    borderColor: '#e5e7eb',
    strokeDashArray: 3,
    xaxis: {
      lines: {
        show: false,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 10,
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  tooltip: {
    theme: 'light',
    x: {
      show: true,
    },
    y: {
      formatter: (value: number): string => {
        return value.toLocaleString('fr-FR');
      },
    },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '14px',
    fontWeight: 500,
    offsetY: 0,
    itemMargin: {
      horizontal: 10,
      vertical: 5,
    },
  },
  markers: {
    size: 0,
  },
  colors: [
    CHART_COLORS.primary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.danger,
    CHART_COLORS.info,
    CHART_COLORS.purple,
    CHART_COLORS.pink,
  ],
  responsive: [
    {
      breakpoint: 640,
      options: {
        chart: {
          toolbar: {
            show: false,
          },
        },
        legend: {
          position: 'bottom',
        },
      },
    },
  ],
};
