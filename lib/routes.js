// path to page. each entry is a function, so a page's code isn't fetched until it's called
export const routes = {'/':()=>import('/imports/pages/home/home')}

export const notFound = ()=>import('/imports/pages/notFound/notFound')
