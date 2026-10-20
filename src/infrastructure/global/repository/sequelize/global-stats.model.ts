import { Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({ tableName: "global_stats", timestamps: false, underscored: true })
export default class GlobalStatsModel extends Model {
  @PrimaryKey
  @Column({ type: DataType.SMALLINT })
  declare id: number;

  @Column({ allowNull: false, type: DataType.BIGINT })
  declare cases: number;

  @Column({ allowNull: false, type: DataType.BIGINT })
  declare deaths: number;

  @Column({ type: DataType.BIGINT })
  declare recovered: number | null;

  @Column({ type: DataType.BIGINT })
  declare active: number | null;

  @Column({ allowNull: false, type: DataType.BIGINT })
  declare todayCases: number;

  @Column({ allowNull: false, type: DataType.BIGINT })
  declare todayDeaths: number;

  @Column({ allowNull: false, type: DataType.INTEGER })
  declare affectedCountries: number;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date | null;
}
