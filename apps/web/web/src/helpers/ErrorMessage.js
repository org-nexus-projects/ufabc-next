import ParseHTTPError from './ParseHTTPError'

// Parses a error and returns it's name and message
export default function (err) {
  var parsed = ParseHTTPError(err)

  if (!parsed) {
    return null
  }

  return parsed.toString()
}