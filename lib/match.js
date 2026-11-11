// which route a path belongs to, or null. no imports so node --test can load it without meteor
export default function match(table, path){
  const trimmed = path.replace(/\/+$/, '') || '/'
  return Object.hasOwn(table, trimmed) ? trimmed : null
}
