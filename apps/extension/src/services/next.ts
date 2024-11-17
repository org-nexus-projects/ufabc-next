import { ofetch } from "ofetch";

function resolveEndpoint() {
  if (import.meta.env.PROD) {
    return 'https://api.v2.ufabcnext.com'
  }

  return 'http://localhost:5000'
}


export const nextService = ofetch.create({
  baseURL: resolveEndpoint(),
})

