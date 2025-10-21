// src/models/User.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class User extends Model {
    /**
     * Compara una contraseña ingresada con la almacenada en la base de datos
     * @param {string} password - contraseña en texto plano
     * @returns {boolean}
     */
    async validatePassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    /**
     * Quita campos sensibles al devolver el objeto como JSON
     */
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: { msg: 'El correo debe tener un formato válido' },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [6, 255],
            msg: 'La contraseña debe tener al menos 6 caracteres',
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('user', 'driver', 'admin'),
        defaultValue: 'user',
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true,
      hooks: {
        /**
         * Hook para hashear la contraseña antes de guardar
         */
        beforeCreate: async (user) => {
          const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
          user.password = await bcrypt.hash(user.password, saltRounds);
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
            user.password = await bcrypt.hash(user.password, saltRounds);
          }
        },
      },
    }
  );

  return User;
};
