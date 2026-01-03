import { logger } from '@/utils/logger.js';
import { ofetch } from 'ofetch';

type Employee = {
  siape: string;
  nome: string;
  unidade_lotacao: string;
  unidade_exercicio: string;
};

type User = {
  fullname: string;
  firstname: string;
  lastname: string;
  username: string;
  usergroupid: number;
  email: string[];
};

export async function getEmployeeData(email: string) {
  if (!process.env.EMAIL_API) {
    return null;
  }

  const response = await ofetch<Employee>(
    `${process.env.EMAIL_API}?funcao=1&valor=${email}`
  );

  return response ? response : null;
}

export async function getStudentData(ra: string) {
  if (!process.env.EMAIL_API) {
    return null;
  }

  const response = await ofetch<User>(
    `${process.env.EMAIL_API}?funcao=2&valor=${ra}`
  );

  if (Object.keys(response).every((key) => key === 'usergroupid')) {
    return null;
  }

  return response;
}

export async function validateUserData(emailToCheck: string, ra: string) {
  const checkUser = await getStudentData(ra);

  if (!checkUser) {
    throw new Error('RA_NOT_FOUND');
  }

  const emailList = Array.isArray(checkUser?.email) ? checkUser.email : [];
  const employeePromises = emailList.map(
    async (email) => await getEmployeeData(email)
  );
  const employees = await Promise.all(employeePromises);
  const validEmployees = employees.filter((employee) => employee !== null);

  if (validEmployees.length > 0) {
    logger.warn({ validEmployees }, 'UFABC employee');
    throw new Error('HAS_UFABC_CONTRACT');
  }

  let email = '';

  if (emailList.length === 0) {
    logger.warn({
      ra,
      username: checkUser.username,
      msg: 'No email found, using username as email',
    });
    email = checkUser.username.concat('@aluno.ufabc.edu.br');
  }

  if (emailList.length > 0) {
    email = emailList[0];
  }

  if (emailToCheck !== email) {
    logger.warn({ emailToCheck, email }, 'wrong email received');
    throw new Error('INVALID_EMAIL');
  }
}
