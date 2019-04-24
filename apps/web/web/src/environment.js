const url = require("url")
const urljoin = require('url-join')

function APILocation() {
  const URL = window.location.href

  if (URL.indexOf('localhost') > 0) {
    return 'http://localhost:8011/v1'
  }

  if (URL.indexOf('192.168') >= 0) {
    return URL.replace(/:\d+.*/, ':8011/v1')
  }

  if(URL.indexOf('test.ufabcnext.com') >= 0) {
    return 'https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/v1'
  }

  if(URL.indexOf('ufabcnext.com') >= 0) {
    return 'https://api.ufabcnext.com/v1'
  }

  const parsedURL = url.parse(URL, false, true)
  return urljoin(parsedURL.protocol, parsedURL.host, '/v1')
}

function HomeLocation() {
  const URL = window.location.href

  if (URL.indexOf('localhost') > 0) {
    return 'http://localhost:7000'
  }

  if(URL.indexOf('ufabcnext.com') >= 0) {
    return 'https://ufabcnext.com'
  }
}

export default {
  API_URL: APILocation(),
  HOME_URL: HomeLocation()
}