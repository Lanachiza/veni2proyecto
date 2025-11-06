const stores = {
  users: new Map(),
  drivers: new Map(),
  trips: new Map()
};
export function getStore(name) {
  if (!stores[name]) throw new Error(`Unknown store: ${name}`);
  return stores[name];
}
export default { getStore };

