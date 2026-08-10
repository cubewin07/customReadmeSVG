const cardsMap = new Map();
const aliasesMap = new Map();

/**
 * Register a card plugin in the registry.
 * @param {import('./types.js').CardPlugin} plugin
 */
export function registerCard(plugin) {
  if (!plugin || !plugin.id) {
    throw new Error('Card plugin must have a valid `id` property.');
  }

  cardsMap.set(plugin.id, plugin);

  if (Array.isArray(plugin.aliases)) {
    for (const alias of plugin.aliases) {
      aliasesMap.set(alias, plugin.id);
    }
  }
}

/**
 * Retrieve card plugin by exact ID.
 * @param {string} id
 * @returns {import('./types.js').CardPlugin|undefined}
 */
export function getCard(id) {
  return cardsMap.get(id);
}

/**
 * List all registered card plugins.
 * @returns {import('./types.js').CardPlugin[]}
 */
export function listCards() {
  return Array.from(cardsMap.values());
}

/**
 * Resolve card plugin by ID or alias. Defaults to 'profile' if missing or bare.
 * @param {string} [idOrAlias]
 * @returns {import('./types.js').CardPlugin|undefined}
 */
export function resolveCard(idOrAlias) {
  const target = (idOrAlias && idOrAlias.trim()) ? idOrAlias.trim() : 'profile';
  if (cardsMap.has(target)) {
    return cardsMap.get(target);
  }
  if (aliasesMap.has(target)) {
    const resolvedId = aliasesMap.get(target);
    return cardsMap.get(resolvedId);
  }
  return undefined;
}
