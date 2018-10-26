import Api from './api'

window.runTabula = function () {
    Tabula.pdf_view.query.attributes.data = null
    Tabula.pdf_view.options.set('extraction_method', 'lattice')
    Tabula.pdf_view.query.setExtractionMethod('lattice');
    Tabula.pdf_view.query.doQuery()
    //create internval
    var interval = setInterval(async function () {
      if(Tabula.pdf_view.query.attributes.data) {
        clearInterval(interval)
        var key = window.prompt('Digite sua chave de autenticação', 'SOME_ACCESS_KEY')

        var response = await Api.put('/disciplinas/teachers?access_key=' + key, {
          disciplinas: Tabula.pdf_view.query.attributes.data
        })

        var confirmed = window.prompt(JSON.stringify(response.disciplinas, null, 4), response.hash)

        if(confirmed == response.hash) {
          await Api.put('/disciplinas/teachers?access_key=' + key, {
            disciplinas: Tabula.pdf_view.query.attributes.data,
            hash: response.hash
          })
        }
      }
    }, 2000)
}