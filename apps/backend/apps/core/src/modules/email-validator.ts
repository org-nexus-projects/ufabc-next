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
    `${process.env.EMAIL_API}?funcao=1&valor=${email}`,
  );

  return response ? response : null;
}

export async function getStudentData(ra: string) {
  if (!process.env.EMAIL_API) {
    return null;
  }

  const response = await ofetch<User>(
    `${process.env.EMAIL_API}?funcao=2&valor=${ra}`,
  );

  if (Object.keys(response).every((key) => key === 'usergroupid')) {
    return null;
  }

  return response;
}
