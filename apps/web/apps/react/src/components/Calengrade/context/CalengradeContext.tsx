import { createContext, PropsWithChildren, useContext, useState } from 'react';

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
  title?: string;
  startDate?: string;
  endDate?: string;
};

export type Calendar = {
  classes: Classes;
  startDate?: string;
  endDate?: string;
};

type CalengradeInfo = {
  classes: Classes;
  quarter: Quarter;
  summary: string;
  calendar?: Calendar | string;
};

type Screen = 'preview' | 'welcome' | 'summary' | 'quarter';

type CalengradeContextProps = {
  calengrade: CalengradeInfo;
  setCalengrade: React.Dispatch<React.SetStateAction<CalengradeInfo>>;
  activeScreen: Screen;
  setActiveScreen: React.Dispatch<React.SetStateAction<Screen>>;
};

const CalengradeContext = createContext<CalengradeContextProps>({
  calengrade: {
    classes: [],
    quarter: {},
    summary: '',
  },
  setCalengrade: () => {},
  activeScreen: 'welcome',
  setActiveScreen: () => {},
});

export const CalengradeProvider = ({ children }: PropsWithChildren) => {
  const [calengrade, setCalengrade] = useState<CalengradeInfo>({
    classes: [],
    quarter: {},
    summary: '',
  });

  const [activeScreen, setActiveScreen] = useState<
    'preview' | 'welcome' | 'summary' | 'quarter'
  >('welcome');

  const contextValue = {
    calengrade,
    setCalengrade,
    activeScreen,
    setActiveScreen,
  };

  return (
    <CalengradeContext.Provider value={contextValue}>
      {children}
    </CalengradeContext.Provider>
  );
};

export const useCalengradeContext = () => useContext(CalengradeContext);
