import React, { useEffect, useState } from 'react';

import { useCalengradeContext } from '../../context/CalengradeContext';
import { definedQuarters } from '../../utils/quarters';

export default function Quarter() {
  const { calengrade, setCalengrade, setActiveScreen } = useCalengradeContext();

  const classesCount = calengrade.classes.length;

  // Initialize quarter index based on context if available
  const [quarter, setQuarter] = useState(() => {
    // If we already have quarter data in context, find its index
    if (calengrade.quarter?.startDate && calengrade.quarter?.endDate) {
      const existingIndex = definedQuarters.findIndex(
        (q) =>
          q.startDate === calengrade.quarter.startDate &&
          q.endDate === calengrade.quarter.endDate,
      );

      if (existingIndex >= 0) {
        return existingIndex;
      }
    }

    // Otherwise find current quarter based on date
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

  // Initialize dates based on the selected quarter or existing context data
  const [startDate, setStartDate] = useState(
    () => calengrade.quarter?.startDate || definedQuarters[quarter].startDate,
  );
  const [endDate, setEndDate] = useState(
    () => calengrade.quarter?.endDate || definedQuarters[quarter].endDate,
  );

  // State for formatted dates (Brazilian format for display)
  const [formattedStartDate, setFormattedStartDate] = useState('');
  const [formattedEndDate, setFormattedEndDate] = useState('');

  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');

  // Update context when quarter, startDate, or endDate changes
  // But don't include calengrade in dependencies to avoid infinite loop
  useEffect(() => {
    const title =
      quarter === 0
        ? 'Quadrimestre personalizado'
        : definedQuarters[quarter].title;

    setCalengrade((prevCalengrade) => ({
      ...prevCalengrade,
      quarter: {
        title: title,
        startDate: startDate,
        endDate: endDate,
      },
    }));
  }, [quarter, startDate, endDate, setCalengrade]);

  // Format the dates whenever they change
  useEffect(() => {
    // Format dates to Brazilian format for display
    if (startDate) {
      const date = new Date(`${startDate}T00:00:00.000`);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setFormattedStartDate(`${day}/${month}/${year}`);
    }

    if (endDate) {
      const date = new Date(`${endDate}T00:00:00.000`);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setFormattedEndDate(`${day}/${month}/${year}`);
    }
  }, [startDate, endDate]);

  // Update both start and end dates when quarter changes
  const handleQuarterChange = (value: number) => {
    console.log('Selected quarter:', value);
    if (value >= 0 && value < definedQuarters.length) {
      setStartDate(definedQuarters[value].startDate);
      setEndDate(definedQuarters[value].endDate);
    }
    setQuarter(value);
  };

  // Parse date from Brazilian format to ISO format
  const parseBrazilianDate = (brazilianDate: string): string | null => {
    const parts = brazilianDate.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
    const year = parseInt(parts[2]);

    const date = new Date(year, month, day);

    // Validate the date
    if (
      isNaN(date.getTime()) ||
      date.getDate() !== day ||
      date.getMonth() !== month ||
      date.getFullYear() !== year
    ) {
      return null;
    }

    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleStartDate = (value: string) => {
    const isoDate = parseBrazilianDate(value);
    if (!isoDate) {
      setStartDateError('Data inválida! Use o formato DD/MM/AAAA');
    } else {
      setStartDateError('');
      setStartDate(isoDate);
    }
  };

  const handleEndDate = (value: string) => {
    const isoDate = parseBrazilianDate(value);
    if (!isoDate) {
      setEndDateError('Data inválida! Use o formato DD/MM/AAAA');
    } else {
      setEndDateError('');
      setEndDate(isoDate);
    }
  };

  const handleClick = (type: 'back' | 'generate') => {
    if (type === 'generate') {
      // Quarter info is already in context from the useEffect
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
            inputMode="text"
            id="startDate"
            type="text"
            placeholder="DD/MM/AAAA"
            value={formattedStartDate}
            onChange={(event) => handleStartDate(event.target.value)}
            disabled={quarter !== 0}
          />
          {startDateError && <p className="error-text">{startDateError}</p>}

          <label htmlFor="endDate">Fim</label>
          <input
            inputMode="text"
            id="endDate"
            type="text"
            placeholder="DD/MM/AAAA"
            value={formattedEndDate}
            onChange={(event) => handleEndDate(event.target.value)}
            disabled={quarter !== 0}
          />
          {endDateError && <p className="error-text">{endDateError}</p>}
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
