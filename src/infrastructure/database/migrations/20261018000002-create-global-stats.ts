import { DataTypes, QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable("global_stats", {
    id: { type: DataTypes.SMALLINT, primaryKey: true, defaultValue: 1 },
    cases: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    deaths: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    recovered: { type: DataTypes.BIGINT, allowNull: true },
    active: { type: DataTypes.BIGINT, allowNull: true },
    today_cases: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    today_deaths: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    affected_countries: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  });
  await queryInterface.sequelize.query(
    "ALTER TABLE global_stats ADD CONSTRAINT global_stats_single_row CHECK (id = 1)",
  );
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable("global_stats");
}
