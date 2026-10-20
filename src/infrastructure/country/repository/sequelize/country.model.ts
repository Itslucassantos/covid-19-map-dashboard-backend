import { Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({ tableName: "countries", timestamps: false, underscored: true })
export default class CountryModel extends Model {
  @PrimaryKey
  @Column({ type: DataType.CHAR(2) })
  declare iso2: string;

  @Column({ allowNull: false, type: DataType.CHAR(3) })
  declare iso3: string;

  @Column({ allowNull: false })
  declare name: string;

  @Column({ allowNull: false, type: DataType.DOUBLE })
  declare lat: number;

  @Column({ allowNull: false, type: DataType.DOUBLE })
  declare lng: number;

  @Column({ type: DataType.BIGINT })
  declare population: number | null;

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

  @Column({ type: DataType.DOUBLE })
  declare casesPerMillion: number | null;

  @Column({ type: DataType.DOUBLE })
  declare deathsPerMillion: number | null;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date | null;
}
