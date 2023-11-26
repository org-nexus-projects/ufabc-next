import React, { useEffect, useRef, useState } from 'react';

import { useCalengradeContext } from '../../context/CalengradeContext';
import { definedQuarters } from '../../utils/quarters';
import { handleSummary } from '../../utils/summary';

export const Summary = () => {
  const { calengrade, setCalengrade, setActiveScreen } = useCalengradeContext();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [summary, setSummary] = useState(() => calengrade.summary ?? '');
  const [message, setMessage] = useState<[string, 'info' | 'error'] | []>([]);

  const [quarter] = useState(() => {
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

  useEffect(() => {
    setCalengrade((calengrade) => ({
      ...calengrade,
      quarter: definedQuarters[quarter],
    }));
  }, [quarter, setCalengrade]);

  const handleChange = (value: string) => {
    setSummary(value);

    if (value === '') {
      setMessage(['Cole seu resumo de disciplinas ;)', 'error']);
    } else if (value.length > 50) {
      const newClasses = handleSummary(value);
      const classesCount = newClasses.length;
      if (classesCount > 0) {
        setMessage([
          `${classesCount} ${
            classesCount === 1
              ? 'disciplina identificada'
              : 'disciplinas identificadas'
          }`,
          'info',
        ]);
        setCalengrade({
          ...calengrade,
          classes: newClasses,
          summary: value,
        });
      } else {
        setMessage(['Nenhuma disciplina identificada :(', 'error']);
        setCalengrade({
          ...calengrade,
          classes: [],
          summary: value,
        });
      }
    } else {
      setMessage([]);
    }
  };

  const handleClick = () => {
    if (summary === '') {
      setMessage(['Cole seu resumo de disciplinas!!!', 'error']);
    } else if ((calengrade.classes ?? []).length <= 0) {
      setMessage(['Nenhuma disciplina identificada :(', 'error']);
    } else {
      setActiveScreen('preview');
    }
  };

  async function handlePaste() {
    try {
      textareaRef.current?.focus();
      const copied = await navigator.clipboard.readText();
      setSummary(copied);
      handleChange(copied);
    } catch (error) {
      textareaRef.current?.focus();
    }
  }

  return (
    <>
      <div className="summary">
        <h1>Cole aqui o seu resumo de disciplinas disponível no</h1>
        <h2>
          <a
            className="hint"
            rel="noopener noreferrer"
            target="_blank"
            href="https://matricula.ufabc.edu.br/matricula/resumo"
          >
            Portal de Matrículas
          </a>
        </h2>

        <h3>
          <div>
            <strong>Quadrimestre:</strong> {calengrade.quarter.title} (
            <button
              onClick={() => setActiveScreen('quarter')}
              className="quadri"
            >
              <u>alterar</u>)
            </button>
          </div>
        </h3>

        <textarea
          ref={textareaRef}
          id="summary"
          placeholder="Exemplo: 
          BIR0603-15 - Ciência, Tecnologia e Sociedade A1-Noturno (Santo André) - TPI (3 - 0 - 4) - Campus Santo André
          Terça-feira das 21:00 às 23:00 - quinzenal (I)
          Quinta-feira das 19:00 às 21:00 - semanal
          NHT1057-15 - Genética II A-Noturno ..."
          value={summary}
          onChange={(event) => handleChange(event.target.value)}
          style={{
            minHeight: '400px',
            margin: '32px 0 0',
          }}
        />
        <p className={message[1]}>{message[0] ?? '. . .'}</p>
      </div>
      {summary === '' ? (
        <button onClick={handlePaste}>Colar</button>
      ) : (
        <button onClick={handleClick}>Gerar Calengrade!</button>
      )}
    </>
  );
};
