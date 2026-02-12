interface CountryInfo {
  flagUrl: string;
  nativeName: string;
}

let countryCache: Map<string, CountryInfo> | null = null;
let fetchPromise: Promise<Map<string, CountryInfo>> | null = null;

async function loadCountryMap(): Promise<Map<string, CountryInfo>> {
  if (countryCache) return countryCache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('https://restcountries.com/v3.1/all?fields=name,cca2,translations')
    .then((res) => res.json())
    .then((data: { name: { common: string }; cca2: string; translations: Record<string, { common: string }> }[]) => {
      const map = new Map<string, CountryInfo>();
      for (const c of data) {
        const code = c.cca2.toLowerCase();
        const nativeName = c.translations?.por?.common || c.name.common;
        map.set(c.name.common.toLowerCase(), {
          flagUrl: `https://flagcdn.com/w80/${code}.png`,
          nativeName,
        });
      }
      countryCache = map;
      return map;
    })
    .catch(() => {
      fetchPromise = null;
      return new Map<string, CountryInfo>();
    });

  return fetchPromise;
}

export async function getCountryFlag(countryName: string): Promise<CountryInfo | null> {
  const map = await loadCountryMap();
  return map.get(countryName.toLowerCase()) || null;
}
