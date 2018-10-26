import Axios from 'axios'

module.exports = new Api()

function resolveEndpoint(env) {
  return {
    'development' : 'http://localhost:8011/v1',
    'staging'     : 'https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/v1',
    'production'  : 'https://ufabc-matricula.cdd.naoseiprogramar.com.br/v1'
  }[env] || 'http://localhost:8011/v1'
}

function Api() {
  this.baseURL = resolveEndpoint(process.env.NODE_ENV)

  this.axios = Axios.create({
    baseURL: this.baseURL,
    timeout: this.timeout,
    headers: this.headers,
  })

  this.axios.interceptors.response.use(function (response) {
    return response.data
  }, function (error) {
    return Promise.reject(_.get(error, 'response.data', error))
  })

  return this.axios
}