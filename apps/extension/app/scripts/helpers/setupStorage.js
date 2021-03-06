module.exports = function setupStorage() {
  document.addEventListener('requestStorage', (event) => {
    const key = event.detail.key
    const date = event.detail.date
    const value = event.detail.value
    const method = event.detail.method.split('-')[0]
    const eventType = event.type
    if(!key || !date || !method || eventType != 'requestStorage') return


    const IS_BROWSER = typeof chrome != "undefined" && !!chrome.storage
    const eventMethod = event.detail.method
    if (IS_BROWSER) {
      console.log(`[${method} | ${key}] Using chrome.storage 🔵`)
      // maybe below is actually resolve(data && data[key]) - please check

      if(method == 'setStorage') {
        chrome.storage.local.set({ [key]: value })
        return document.dispatchEvent(new CustomEvent(eventMethod, {
          "detail": {
            "key": key,
            "value": value
          }
        }))
      } else if(method == 'getStorage') {
        return chrome.storage.local.get(key, (data) => { 
          document.dispatchEvent(new CustomEvent(eventMethod, {
            "detail": {
              "key": key,
              "value": data && data[key]
            }
          }))
        })
      }
    } 

    console.log(`[${method} | ${key}] Using xdLocalStorage 🔴`)
    if(method == 'setStorage') {
      window.xdLocalStorage.setItem(key, JSON.stringify(value), (data) => { 
        document.dispatchEvent(new CustomEvent(eventMethod, {
          "detail": {
            "key": key,
            "value": date.value
          }
        }))
      })  
    } else if(method == 'getStorage') {
      window.xdLocalStorage.getItem(key, (data) => { 
        document.dispatchEvent(new CustomEvent(eventMethod, {
          "detail": {
            "key": key,
            "value": JSON.parse(data.value)
          }
        }))
      })
    }
  })
}