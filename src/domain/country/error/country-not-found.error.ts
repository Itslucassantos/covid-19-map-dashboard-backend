export default class CountryNotFoundError extends Error {
  constructor() {
    super("Country not found");
    this.name = "CountryNotFoundError";
  }
}
