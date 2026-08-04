const getConfiguration = (token = '') => {
  const headers = {
    json: 'application/json'
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return {
    headers,
    json: true
  }
}

module.exports = getConfiguration
