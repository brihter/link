const pd_catalog = ctx => {
  const mapping = {
    key: 'TEXT',
    catalog_name: 'TEXT',
    catalog_page: 'TEXT'
  }

  const source = () => {
    return `
      select
        x."key",
        x."catalog_name",
        x."catalog_page"
      from etl_catalog x
      order by
        1
    `
  }

  return {
    name: 'pd_catalog',
    mapping,
    source
  }
}

export { pd_catalog }
