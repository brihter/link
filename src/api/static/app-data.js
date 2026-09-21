Ext.ns('app_data')

app_data.cubes = []

app_data.getCube = name => {
  return app_data.cubes.find(cube => cube.name === name)
}

app_data.load = async () => {
  return new Promise((resolve, reject) => {
    Ext.Ajax.request({
      url: '/cubes',
      method: 'GET',
      success: response => {
        try {
          const cubes = JSON.parse(response.responseText)
          if (!Array.isArray(cubes) || cubes.length === 0) {
            throw new Error('No cubes are available')
          }
          app_data.cubes = cubes
          resolve(cubes)
        } catch (error) {
          reject(error)
        }
      },
      failure: () => {
        reject(new Error('Could not load cubes'))
      }
    })
  })
}
