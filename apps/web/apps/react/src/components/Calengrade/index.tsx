import React from 'react';

import './calengrade.css';

import logo from './assets/logo.svg';
import { CalengradeProvider } from './context/CalengradeContext';
import { CalengradeScreens } from './Screens';

const Calengrade = () => (
  <div id="calengrade">
    <div className="app">
      <img src={logo} alt="logo do Calengrade" className="logo" />
      <CalengradeProvider>
        <div className="content">
          <CalengradeScreens />
        </div>
      </CalengradeProvider>
      <h3>
        O Calengrade foi desenvolvido em 2020 por{' '}
        <a href="https://link.cariri.tech/calengrade-linkedin">
          Marcelo Farias
        </a>
        , um ex aluno da UFABC.
      </h3>
    </div>
  </div>
);

export default Calengrade;
