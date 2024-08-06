import mysql from 'mysql2/promise';

let connection: mysql.Connection | null = null;

async function connect() {
  if (!connection) {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_SCHEMA
    });
  }

  return connection;
  
}

export default connect;
