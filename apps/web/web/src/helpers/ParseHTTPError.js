// Parses a error and returns it's name and message
export default function (err) {
  // Its not an error
  if (!err) {
    return null
  }

  // If it's an response wrapped in an error, unwrap it
  var response = err.response ? err.response : err

  // If not a valid object, return
  if (!response) {
    return err
  }

  // Not a response object
  if (!response.data) {
    return err
  }
  // If it has a Response object
  var data = response.data
  if (data.type) {
    return BuildError({
      type: "Error",
      error: data.error,
      // code: response.status
    })
  }

  // Default is to return the 
  return BuildError({
    type: typeForCode(data.status),
    error: data,
    code: data.status,
  })
}

function typeForCode(code){ 
  return {
    '400': 'BadRequest',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'NotFound',
    '409': 'Conflict',
    '422': 'Unprocessable',
    '500': 'InternalError',
  }[code] || code
}

function BuildError(obj) {
  var error = new Error(obj.error)
  error.name = obj.type || error.name
  
  Object.assign(error, obj)

  return error
}