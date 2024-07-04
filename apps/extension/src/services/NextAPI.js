import Axios from 'axios';

function resolveEndpoint(env) {
  return (
    {
      development: 'http://localhost:5000/v2',
      staging: 'https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/v1',
      production: 'http://localhost:5000/v2',
    }[env] || 'http://localhost:5000/v2'
  );
}

function NextAPI() {
  const baseURL = resolveEndpoint(process.env.NODE_ENV);
  const REQUEST_TIMEOUT = 5000;
  const nextAPI = Axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  return nextAPI;
}

module.exports = {
  NextAPI,
};
