export type Classes = {
  title: string | null;
  campus: string | null;
  info: {
    title: string;
    content: string | null;
  }[];
  times: {
    day: string | null;
    start: string | null;
    end: string | null;
    repeat: string | null;
  }[];
}[];

export type Quarter = {
  title: string;
  startDate: string;
  endDate: string;
};

export type Calendar = {
  classes: Classes;
  startDate?: string;
  endDate?: string;
};

export type CalengradeInfo = {
  classes: Classes | null;
  quarter: Quarter;
  summary: string;
  calendar?: Calendar | string;
};

export enum CalengradeSteps {
  Welcome = 'Welcome',
  Summary = 'Summary',
  ChangeQuarter = 'ChangeQuarter',
  Preview = 'Preview',
}
