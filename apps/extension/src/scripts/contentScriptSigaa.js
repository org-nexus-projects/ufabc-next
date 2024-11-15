import { scrapeGradesConsulting, scrapeHomepage } from '../utils/sigaa';
import {
  errorToast,
  redirectToast,
  processingToast,
  successToast
} from '../utils/nextToasts';
import Axios from 'axios';

const sigaaURL = new URL(document.location.href);
const isDiscentesPath = sigaaURL.pathname.includes('discente.jsf');

if (
  isDiscentesPath &&
  document.contains(document.querySelector('#agenda-docente'))
) {
  const student = scrapeHomepage();
  const toast = redirectToast(student.name);
  localStorage.setItem('studentInfo', JSON.stringify(student));
  toast.showToast();
}

if (isDiscentesPath && document.contains(document.querySelector('.notas'))) {
  processingToast.showToast();
  const studentHistory = scrapeGradesConsulting();
  // todo: fazer o endpoint
  Axios.post(
    'http://localhost:5000/histories/sigaa',
    studentHistory,
    {
      timeout: 60 * 1 * 1000, // 1 minute
    },
  ).then(() => {
    successToast.showToast()
  })
  .catch(() => {
    errorToast.showToast();
  }).finally(() => setTimeout(() => processingToast.hideToast(), 1000));
}
