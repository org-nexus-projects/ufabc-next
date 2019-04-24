import Axios from 'axios'
import Vue from 'vue'

class Comment {
  constructor(){}

  async get(teacherId, subjectId) {
    return await Axios.get('/comment/' + teacherId + '/' + subjectId)
    // return {
    //   data: [
    //     {
    //       text: 'Professor super gente boa, recomendo!',
    //       likesCount: 2,
    //       helpfulCount: 10,
    //       year: 2019,
    //       quad: 1,
    //       conceito: 'A',
    //       subject: {
    //         createdAt: "2018-11-22T00:44:12.265Z",
    //         name: "Cálculo Numérico",
    //         search: "Calculo Numerico",
    //         updatedAt: "2018-11-22T00:44:12.265Z",
    //         _id: "5bf5fbdb436c414f35a8efdd",
    //       },
    //       _id: '3',
    //       author: null,
    //     },
    //     {
    //       text: 'Eu não concordo muito com a didática mas deu para passar, dava para ter ido com um pouco melhor se estivesse estudado mais para a P1, pq tava bem fácil. O que salvou foi a P2 que foi em dupla.',
    //       likesCount: 2,
    //       helpfulCount: 10,
    //       year: 2019,
    //       quad: 2,
    //       conceito: 'D',
    //       subject: {
    //         createdAt: "2018-11-22T00:44:12.281Z",
    //         name: "Introdução à Probabilidade e à Estatística",
    //         search: "Introducao A Probabilidade EA Estatistica",
    //         updatedAt: "2018-11-22T00:44:12.281Z",
    //         _id: "5bf5fbdc436c414f35a8f141",
    //       },
    //       _id: '2',
    //       author: null
    //     },
    //     {
    //       text: 'ME FERREI COM ESSE CARA',
    //       likesCount: 2,
    //       helpfulCount: 10,
    //       year: 2017,
    //       quad: 2,
    //       conceito: 'F',
    //       subject: {
    //         createdAt: "2018-11-22T00:44:12.281Z",
    //         name: "Introdução à Probabilidade e à Estatística",
    //         search: "Introducao A Probabilidade EA Estatistica",
    //         updatedAt: "2018-11-22T00:44:12.281Z",
    //         _id: "5bf5fbdc436c414f35a8f141",
    //       },
    //       _id: '5',
    //       author: null
    //     }
    //   ]
    // }
  }

  async missing() {
    return await Axios.get('/comment/missing')
  }
}

export default (new Comment)