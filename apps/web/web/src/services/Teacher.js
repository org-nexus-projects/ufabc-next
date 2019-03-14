import Axios from 'axios'
import Vue from 'vue'

class Teacher {
  constructor(){}

  async search(q) {
    return await Axios.get('/teachers/search?q=' + q)
  }

  async comments(id){
    return {
      data: [
        {
          text: 'Coxa para caramba.',
          upVotting: 2,
          downVotting: 2,
          year: 2019,
          quad: 2,
          conceito: 'A',
          subject: {
            createdAt: "2018-11-22T00:44:12.265Z",
            name: "Cálculo Numérico",
            search: "Calculo Numerico",
            updatedAt: "2018-11-22T00:44:12.265Z",
            _id: "5bf5fbdb436c414f35a8efdd",
          },
          _id: '3',
          author: null,
        },
        {
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam sodales purus non dignissim feugiat. Nulla eget lectus nisl. Mauris posuere eu ipsum a dapibus. Vestibulum vel nulla posuere, sagittis tellus id, venenatis tellus. Morbi porttitor rhoncus nunc, eu luctus ligula. Cras vitae ipsum facilisis, commodo quam eu, viverra est. Suspendisse sit amet tellus aliquam, mollis tortor vitae, luctus lacus. Suspendisse potenti. Proin et commodo neque. Phasellus a lorem et libero luctus pellentesque. Ut non rutrum dolor. Integer quis lacus risus. Aliquam nulla leo, tempus finibus dui sit amet, vulputate sagittis dolor. In rutrum est sit amet dictum auctor. Nam porta leo ultrices ante aliquam, at tempus dui finibus. Donec pulvinar euismod leo in hendrerit.',
          upVotting: 2,
          downVotting: 2,
          year: 2019,
          quad: 2,
          conceito: 'D',
          subject: {
            createdAt: "2018-11-22T00:44:12.281Z",
            name: "Introdução à Probabilidade e à Estatística",
            search: "Introducao A Probabilidade EA Estatistica",
            updatedAt: "2018-11-22T00:44:12.281Z",
            _id: "5bf5fbdc436c414f35a8f141",
          },
          _id: '2',
          author: null
        },
        {
          text: 'ME FERREI COM ESSE CARA',
          upVotting: 2,
          downVotting: 2,
          year: 2019,
          quad: 2,
          conceito: 'F',
          subject: {
            createdAt: "2018-11-22T00:44:12.281Z",
            name: "Introdução à Probabilidade e à Estatística",
            search: "Introducao A Probabilidade EA Estatistica",
            updatedAt: "2018-11-22T00:44:12.281Z",
            _id: "5bf5fbdc436c414f35a8f141",
          },
          _id: '5',
          author: null
        }

      ]
    }
    // return await Axios.get('/teachers/:teacherId/comments')
  }
}

export default (new Teacher)