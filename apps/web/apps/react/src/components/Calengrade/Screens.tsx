import { Preview } from './components/Preview';
import Quarter from './components/Quarter/Quarter';
import { Summary } from './components/Summary';
import { Welcome } from './components/Welcome';
import { useCalengradeContext } from './context/CalengradeContext';

export const CalengradeScreens = () => {
  const { activeScreen } = useCalengradeContext();

  if (activeScreen === 'welcome') return <Welcome />;

  if (activeScreen === 'summary') return <Summary />;

  if (activeScreen === 'quarter') return <Quarter />;

  if (activeScreen === 'preview') return <Preview />;

  return <Welcome />;
};
