// preciso pegar o arquivo 

import { categoriesHandler } from "@/modules/Sync/handlers/parseCategoriesFromXlsx.js";
import type { FastifyRequest } from "fastify";

// extrair os valores sigla ,TPEI, ementa, curso(categoria)

// A carga horária semanal de cada disciplina é dada no formato (T-P-E-I),
// isto é, o número de horas de aulas teóricas, seguido do número de horas de aulas práticas, 
// seguido do número de horas em atividades de extensão e, finalmente, 
// do número de horas que corresponde a estudo individual extraclasse.

// fazer um split usando a chave ; 

// regex buscando o valor entre ()

// usar a busca com o codigo da disciplina/ sigla 


export async function syncDisciplineCategories(
    request: FastifyRequest,
  ) {
    categoriesHandler(request.body)


  }
