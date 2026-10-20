import DailyStatRepositoryInterface from "../../../domain/history/repository/daily-stat-repository.interface";
import { toHistoryPoint } from "../history.mapper";
import { InputFindGlobalHistoryDto, OutputFindGlobalHistoryDto } from "./find.global-history.dto";

export default class FindGlobalHistoryUseCase {
  constructor(private readonly dailyStatRepository: DailyStatRepositoryInterface) {}

  async execute(input: InputFindGlobalHistoryDto): Promise<OutputFindGlobalHistoryDto> {
    const stats = await this.dailyStatRepository.findLast(null, input.days);
    return { history: stats.map(toHistoryPoint) };
  }
}
