import React from 'react';

import welcomeImage from '../../assets/calendar.svg';
import { useCalengradeContext } from '../../context/CalengradeContext';

export const Welcome = () => {
  const { setActiveScreen } = useCalengradeContext();

  return (
    <>
      <div>
        <h1 className="text-calengrade-yellow">
          Adicione sua grade de matérias da UFABC ao seu calendário
        </h1>
        <h2>
          Gratuito e compatível com os principais aplicativos de celular e
          computador
        </h2>
      </div>

      <img
        src={welcomeImage}
        alt="Calendário acadêmico"
        style={{
          margin: '32px 0',
        }}
      />

      <button
        className=""
        onClick={() => {
          setActiveScreen('summary');
        }}
      >
        Começar
      </button>
    </>
  );
};
