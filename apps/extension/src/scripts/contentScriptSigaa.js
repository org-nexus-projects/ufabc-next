import { scrapeGradesConsulting, scrapeHomepage } from '../utils/sigaa';
import { NextAPI } from '../services/NextAPI';
import {
  errorToast,
  redirectToast,
  processingToast,
} from '../utils/nextToasts';

const nextApi = NextAPI();

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
  const { data: res } = nextApi
    .post('/histories/sigaa', studentHistory, {
      timeout: 60 * 1 * 1000, // 1 minute
    })
    .catch((err) => {
      processingToast.hideToast();
      console.log(err);
      errorToast.showToast();
    });

  setTimeout(() => processingToast.hideToast(), 3000);
}
