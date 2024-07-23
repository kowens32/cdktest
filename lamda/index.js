const mysql = require('mysql2/promise');

exports.handler = async (event) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const [rows, fields] = await connection.execute('SELECT 1 + 1 AS solution');
  await connection.end();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'The solution is: ' + rows[0].solution
    })
  };
};
