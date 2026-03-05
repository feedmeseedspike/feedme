/**
 * Search Synonyms Mapping
 * This map helps connect local names, common variations, and English counterparts
 * for better search results.
 */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Peppers
  "pepper": ["rodo", "ata rodo", "shombo", "tatashe", "habanero", "chili"],
  "rodo": ["pepper", "ata rodo", "habanero"],
  "ata": ["pepper", "rodo", "ata rodo"],
  "shombo": ["pepper", "long pepper", "chili"],
  "tatashe": ["pepper", "bell pepper", "capsicum"],
  
  // Grains & Tubers
  "rice": ["jollof", "basmati", "local rice", "ofada", "brown rice", "tropical island"],
  "ofada": ["rice", "local rice"],
  "yam": ["dun-dun", "asaro", "pounded yam", "i yan", "tubers"],
  "garri": ["ijebu", "yellow garri", "white garri", "cassava flours", "staple"],
  "cassava": ["garri", "fufu", "lafun"],
  "maize": ["corn", "jero", "guinea corn", "sorghum", "oka baba"],
  "corn": ["maize", "sweet corn", "popcorn"],
  
  // Proteins
  "beef": ["meat", "cow meat", "corn beef"],
  "chicken": ["poultry", "lap", "wings", "gizzard", "layers", "hen"],
  "fish": ["tititus", "croaker", "stock fish", "panla", "hake", "owere", "prawns", "periwinkle"],
  "meat": ["beef", "goat meat", "ram", "chicken", "protein", "cow leg"],
  "goat": ["meat", "ogufe"],
  
  // Vegetables & Roots
  "onion": ["onions", "albasa", "red onion", "white onion"],
  "tomato": ["tomatoes", "tomati", "paste", "puree"],
  "potato": ["potatoes", "sweet potato", "irish potato", "tubers"],
  "carrot": ["carrots"],
  "cabbage": ["cabbages"],
  "lettuce": ["lettuces"],
  "cucumber": ["cucumbers"],
  "eggplant": ["eggplants", "garden egg", "igba"],
  "okra": ["okro", "lady's finger", "ila"],
  "spinach": ["efo", "tete", "shoko"],
  "ugwu": ["pumpkin leaves", "u-gu"],
  
  // Seeds & Nuts
  "seed": ["nuts", "flax", "maca", "sesame", "almond", "tiger nut", "groundnut", "peanut"],
  "nut": ["seed", "groundnut", "almond", "cashew", "tiger nut"],
  "groundnut": ["peanut", "epa"],
  "tiger nut": ["aya", "ofio", "aki awusa"],
  "egusi": ["melon", "melon seed"],
  "ogbono": ["draw soup", "apon"],

  // Herbal Teas & Health
  "tea": ["herbal", "infusion", "ceylon", "chamomile", "licorice", "detox"],
  "herbal": ["tea", "roots", "leaves", "maca", "cinnamon", "tumeric", "ginger"],
  "cinnamon": ["ceylon", "spice"],
  "tumeric": ["turmeric", "spice", "health"],

  // Oils & Others
  "oil": ["vegetable oil", "palm oil", "groundnut oil", "kings oil", "mamador", "laziz", "terra"],
  "palm oil": ["red oil", "epo", "banga"],
  "banga": ["palm fruit", "palm oil", "extract"],
  "salt": ["mr chef", "dangote salt"],
  "sugar": ["st louis", "dangote sugar"],
  "flour": ["wheat", "semovita", "semolina", "elubo", "amala", "corn flour", "yam flour"],
  "amala": ["elubo", "yam flour", "black flour"],
  "beans": ["ewa", "honey beans", "oloyin", "iron beans", "kidney beans", "baked beans"],
  "ewa": ["beans"],
  "egg": ["eggs"],
  "milk": ["peak", "dano", "cowbell", "creamer", "evaporated"],
  "bread": ["sliced", "agege", "wheat bread"],
  
  // Common terms
  "seasoning": ["maggie", "knorr", "ajinomoto", "royco", "bullion", "cube", "spice"],
  "maggie": ["seasoning", "knorr", "cube", "maggi"],
  "maggi": ["seasoning", "knorr", "cube", "maggie"],
};

/**
 * Computes the Levenshtein distance between two strings.
 * Used for typo tolerance.
 */
function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Expands a search query into multiple terms based on synonyms and typo tolerance.
 * @param query The user's search query
 * @returns An array of strings to search for
 */
export function expandSearchTerms(query: string): string[] {
  if (!query) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  const terms = new Set<string>();
  terms.add(normalizedQuery);

  const synonymsKeys = Object.keys(SEARCH_SYNONYMS);
  
  // Helper to add synonyms for a word
  const addSynonyms = (word: string) => {
    // 1. Check exact match
    if (SEARCH_SYNONYMS[word]) {
      SEARCH_SYNONYMS[word].forEach(t => terms.add(t));
      return true;
    }
    
    // 2. Typo tolerance: Check for close matches in synonym keys
    // Only for words longer than 3 chars to avoid false positives
    if (word.length > 3) {
      for (const key of synonymsKeys) {
        // Max distance of 1 for words 4-5 chars, 2 for longer words
        const maxDist = key.length > 5 ? 2 : 1;
        if (getLevenshteinDistance(word, key) <= maxDist) {
          terms.add(key);
          SEARCH_SYNONYMS[key].forEach(t => terms.add(t));
          return true;
        }
      }
    }
    return false;
  };

  // Check whole query
  addSynonyms(normalizedQuery);

  // Simple pluralization/singularization
  const handlePlurals = (word: string) => {
    if (word.length < 3) return;
    
    // Singular to Plural (very basic)
    if (word.endsWith('o')) terms.add(word + 'es');
    else if (word.endsWith('y')) terms.add(word.slice(0, -1) + 'ies');
    else if (!word.endsWith('s')) terms.add(word + 's');
    
    // Plural to Singular
    if (word.endsWith('ies')) terms.add(word.slice(0, -3) + 'y');
    else if (word.endsWith('es')) terms.add(word.slice(0, -2));
    else if (word.endsWith('s')) terms.add(word.slice(0, -1));
  };

  handlePlurals(normalizedQuery);

  // Check individual words if multi-word query
  const words = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 1) {
    words.forEach(word => {
      addSynonyms(word);
      handlePlurals(word);
    });
  }

  return Array.from(terms);
}

/**
 * Builds a Supabase .or() filter string for searching multiple columns with multiple terms.
 * @param terms Array of search terms
 * @param columns Array of columns to search in
 * @returns A string suitable for .or()
 */
export function buildSearchFilter(terms: string[], columns: string[] = ["name", "description", "brand"]): string {
  const filters: string[] = [];
  
  // Limit the number of terms to search to avoid extremely long URLs
  // but keep the most relevant ones. 10 is usually enough.
  const limitedTerms = terms.slice(0, 10);
  
  limitedTerms.forEach(term => {
    // Escape special characters for ilike
    const escapedTerm = term.replace(/[%_]/g, '\\$&');
    
    columns.forEach(col => {
      filters.push(`${col}.ilike.%${escapedTerm}%`);
    });
  });
  
  return filters.join(',');
}

/**
 * Sorts a list of products based on their relevance to the search query.
 * Relevancy order: exact name match > name starts with > name contains > others.
 */
export function sortProductsByRelevance<T extends { name: string; description?: string | null; tags?: string[] | null }>(
  products: T[],
  query: string
): T[] {
  if (!query || query === "all") return products;
  
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
  
  return [...products].sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    // 1. Exact Name Match
    const aExact = aName === normalizedQuery;
    const bExact = bName === normalizedQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // 2. Starts with Query
    const aStarts = aName.startsWith(normalizedQuery);
    const bStarts = bName.startsWith(normalizedQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    
    // 3. Contains the exact whole phrase
    const aContainsPhrase = aName.includes(normalizedQuery);
    const bContainsPhrase = bName.includes(normalizedQuery);
    if (aContainsPhrase && !bContainsPhrase) return -1;
    if (!aContainsPhrase && bContainsPhrase) return 1;

    // 4. Multi-word match: Contains ALL words from query (highest relevance for non-contiguous)
    if (queryWords.length > 1) {
      const aAllWords = queryWords.every(word => aName.includes(word));
      const bAllWords = queryWords.every(word => bName.includes(word));
      if (aAllWords && !bAllWords) return -1;
      if (!aAllWords && bAllWords) return 1;
    }
    
    // 5. Check tags for exact or partial match
    const aTagsMatched = a.tags?.some(t => t.toLowerCase().includes(normalizedQuery));
    const bTagsMatched = b.tags?.some(t => t.toLowerCase().includes(normalizedQuery));
    if (aTagsMatched && !bTagsMatched) return -1;
    if (!aTagsMatched && bTagsMatched) return 1;

    // 6. Name Contains Query (Generic)
    const aContains = aName.includes(normalizedQuery);
    const bContains = bName.includes(normalizedQuery);
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;
    
    return 0;
  });
}
