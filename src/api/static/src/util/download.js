Ext.ns('X.util')

X.util.download = (url, opts) => {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.target = '_blank'
  anchor.style = 'display:none;'

  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}
