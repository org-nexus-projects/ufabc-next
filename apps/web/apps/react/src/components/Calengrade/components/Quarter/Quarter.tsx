import React, { useState } from 'react';

import { useCalengradeContext } from '../../context/CalengradeContext';
import { definedQuarters } from '../../utils/quarters';

export default function Quarter() {
  const { calengrade, setCalengrade, setActiveScreen } = useCalengradeContext();

  const classesCount = calengrade.classes.length;

  const [quarter, setQuarter] = useState(() => {
    const now = Date.now();
    for (let q = 1; q < definedQuarters.length; q++) {
      const quarterEndDate = new Date(
        `${definedQuarters[q].endDate}T00:00:00.000`,
      );
      if (now > quarterEndDate.getTime()) {
        return q - 1;
      } else {
        const quarterStartDate = new Date(
          `${definedQuarters[q].startDate}T00:00:00.000`,
        );
        if (now >= quarterStartDate.getTime()) {
          return q;
        }
      }
    }
    return 0;
  });

  const [startDate, setStartDate] = useState(
    () => definedQuarters[quarter].startDate,
  );
  const [endDate, setEndDate] = useState(
    () => definedQuarters[quarter].endDate,
  );

  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');

  const handleQuarterChange = (value: number) => {
    if (value !== 0) {
      setStartDate(definedQuarters[value].startDate);
      setEndDate(definedQuarters[value].endDate);
    }
    setQuarter(value);
  };

  const handleStartDate = (value: string) => {
    if (value === '') {
      // is not a date
      setStartDateError('Erro!');
    } else {
      setStartDateError('');
      setStartDate(value);
    }
  };

  const handleEndDate = (value: string) => {
    if (value === '') {
      // is not a date
      setEndDateError('Erro!');
    } else {
      setEndDateError('');
      setEndDate(value);
    }
  };

  const handleClick = (type: 'back' | 'generate') => {
    if (type === 'generate') {
      setCalengrade({
        ...calengrade,
        quarter: {
          title:
            quarter === 0
              ? 'Quadrimestre personalizado'
              : definedQuarters[quarter].title,
          startDate,
          endDate,
        },
      });
      setActiveScreen('preview');
      return;
    }

    setActiveScreen('summary');
  };

  return (
    <>
      <div>
        <h1>Selecione um quadrimestre</h1>
        <h2>
          Datas disponíveis no{' '}
          <a
            className="hint"
            rel="noopener noreferrer"
            target="_blank"
            href="https://prograd.ufabc.edu.br/calendarios"
          >
            Calendário acadêmico
          </a>
        </h2>
        <div
          style={{
            margin: '32px 0',
          }}
        >
          <label htmlFor="quarter">Quadrimestre</label>
          <select
            id="quarter"
            value={quarter}
            onChange={(event) =>
              handleQuarterChange(Number(event.target.value))
            }
          >
            {(definedQuarters || []).map((quarter, i) => (
              <option key={i} value={i}>
                {quarter.title}
              </option>
            ))}
          </select>

          <label htmlFor="startDate">Início</label>
          <input
            inputMode="numeric"
            id="startDate"
            type="date"
            value={startDate}
            onChange={(event) => handleStartDate(event.target.value)}
            disabled={quarter !== 0}
          />
          {startDateError ?? <p>{startDateError}</p>}

          <label htmlFor="endDate">Fim</label>
          <input
            inputMode="numeric"
            id="endDate"
            type="date"
            value={endDate}
            onChange={(event) => handleEndDate(event.target.value)}
            disabled={quarter !== 0}
          />
          {endDateError ?? <p>{endDateError}</p>}
        </div>
      </div>

      {classesCount === 0 ? (
        <button onClick={() => handleClick('back')}>Voltar</button>
      ) : (
        <>
          <div>
            {calengrade.classes.length} disciplina(s) identificada(s){' '}
            <button onClick={() => setActiveScreen('summary')}>
              <u>(alterar)</u>
            </button>
          </div>
          <button onClick={() => handleClick('generate')}>
            Gerar Calengrade!
          </button>
        </>
      )}
    </>
  );
}
