export default function(season) {
  let seasonSplited = season.split(':')
  if(seasonSplited.length < 2) return ''
  return seasonSplited[1] + 'º Quad de ' + seasonSplited[0]
}