// src/models/Trip.js
const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class Trip extends Model {}

  Trip.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuidv4,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      origin: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: false,
        comment: 'Coordenadas del punto de partida',
      },
      destination: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: false,
        comment: 'Coordenadas del destino final',
      },
      status: {
        type: DataTypes.ENUM('requested', 'assigned', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'requested',
      },
      distanceKm: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Distancia estimada en kilómetros',
      },
      estimatedTimeMin: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Duración estimada del viaje en minutos',
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Costo estimado del viaje',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Campo flexible para almacenar información adicional (por ejemplo, tipo de vehículo, clima, predicciones ML, etc.)',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Trip',
      tableName: 'trips',
      timestamps: true,
      underscored: true,
    }
  );

  return Trip;
};
