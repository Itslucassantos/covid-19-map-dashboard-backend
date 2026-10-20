import { HistoryPointDto } from "../history.dto";

export type InputFindCountryHistoryDto = {
  iso2: string;
  days: number;
};

export type OutputFindCountryHistoryDto = {
  iso2: string;
  history: HistoryPointDto[];
};
