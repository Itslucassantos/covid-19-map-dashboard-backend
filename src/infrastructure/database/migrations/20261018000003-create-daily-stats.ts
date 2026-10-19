import { DataTypes, QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable("daily_stats", {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    country_iso2: {
      type: DataTypes.CHAR(2),
      allowNull: true,
      references: { model: "countries", key: "iso2" },
      onDelete: "CASCADE",
    },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    cases: { type: DataTypes.BIGINT, allowNull: false },
    deaths: { type: DataTypes.BIGINT, allowNull: false },
    new_cases: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    new_deaths: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
  });
  await queryInterface.sequelize.query(
    "CREATE UNIQUE INDEX daily_stats_country_date_unique ON daily_stats (country_iso2, date) WHERE country_iso2 IS NOT NULL",
  );
  await queryInterface.sequelize.query(
    "CREATE UNIQUE INDEX daily_stats_global_date_unique ON daily_stats (date) WHERE country_iso2 IS NULL",
  );
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable("daily_stats");
}
