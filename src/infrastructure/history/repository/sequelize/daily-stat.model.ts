import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({ tableName: "daily_stats", timestamps: false, underscored: true })
export default class DailyStatModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.BIGINT })
  declare id: number;

  @Column({ type: DataType.CHAR(2) })
  declare countryIso2: string | null;

  @Column({ allowNull: false, type: DataType.DATEONLY })
  declare date: string;

  @Column({ allowNull: false, type: DataType.BIGINT })
  declare cases: number;

  @Column({ allowNull: false, type: DataType.BIGINT })
  declare deaths: number;

  @Column({ allowNull: false, type: DataType.BIGINT })
  declare newCases: number;

  @Column({ allowNull: false, type: DataType.BIGINT })
  declare newDeaths: number;
}
