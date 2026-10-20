import { HistoryPointDto } from "../history.dto";

export type InputFindGlobalHistoryDto = {
  days: number;
};

export type OutputFindGlobalHistoryDto = {
  history: HistoryPointDto[];
};
