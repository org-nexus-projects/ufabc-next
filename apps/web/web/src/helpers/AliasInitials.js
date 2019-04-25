
export default function(alias){
  if(!alias) return ''

  let aliasSpllited = alias.split('.')
  if(aliasSpllited.length > 1) {
    return alias[0]+aliasSpllited[1][0]
  }

  return alias[0] + alias[1]
} 