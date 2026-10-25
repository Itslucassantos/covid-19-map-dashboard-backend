import { DataTypes, QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable("countries", {
    iso2: { type: DataTypes.CHAR(2), primaryKey: true },
    iso3: { type: DataTypes.CHAR(3), allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    lat: { type: DataTypes.DOUBLE, allowNull: false },
    lng: { type: DataTypes.DOUBLE, allowNull: false },
    population: { type: DataTypes.BIGINT, allowNull: true },
    cases: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    deaths: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    recovered: { type: DataTypes.BIGINT, allowNull: true },
    active: { type: DataTypes.BIGINT, allowNull: true },
    today_cases: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    today_deaths: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    cases_per_million: { type: DataTypes.DOUBLE, allowNull: true },
    deaths_per_million: { type: DataTypes.DOUBLE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable("countries");
}
