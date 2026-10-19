export default class UpstreamUnavailableError extends Error {
  readonly code = "UPSTREAM_UNAVAILABLE";

  constructor(message: string) {
    super(message);
    this.name = "UpstreamUnavailableError";
  }
}
