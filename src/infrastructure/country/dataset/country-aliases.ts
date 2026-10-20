// Names used by the upstream source (Johns Hopkins style) that differ from the dataset names.
// Keyed by iso2; the seed also uses these as fallback `country` query values.
const countryAliases: Record<string, string[]> = {
  US: ["US", "United States of America"],
  KR: ["Korea, South", "South Korea"],
  KP: ["Korea, North", "North Korea"],
  MM: ["Burma"],
  CD: ["Congo (Kinshasa)", "DR Congo"],
  CG: ["Congo (Brazzaville)", "Republic of the Congo"],
  CI: ["Cote d'Ivoire", "Ivory Coast"],
  CZ: ["Czechia", "Czech Republic"],
  TW: ["Taiwan*", "Taiwan"],
  PS: ["West Bank and Gaza"],
  CV: ["Cabo Verde", "Cape Verde"],
  SZ: ["Eswatini", "Swaziland"],
  MK: ["North Macedonia", "Macedonia"],
  TL: ["Timor-Leste", "East Timor"],
  RU: ["Russia"],
  VN: ["Vietnam"],
  LA: ["Laos"],
  SY: ["Syria"],
  IR: ["Iran"],
  BN: ["Brunei"],
  GM: ["Gambia, The", "The Gambia"],
  BS: ["Bahamas, The", "The Bahamas"],
  VA: ["Holy See"],
  XK: ["Kosovo"],
};

export default countryAliases;
