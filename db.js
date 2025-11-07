// db.js
const mysql = require('mysql2');

// Crie um "pool" de conexões. É mais eficiente que criar uma nova conexão a cada consulta.
const pool = mysql.createPool({
    host: 'localhost',       // Ou o IP do seu servidor MySQL
    user: 'root',            // Seu usuário MySQL
    password: '',    // Sua senha MySQL
    database: 'saepdb',      // O banco que criamos na Etapa 3
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exporta o pool "promisificado" para usar async/await
module.exports = pool.promise();