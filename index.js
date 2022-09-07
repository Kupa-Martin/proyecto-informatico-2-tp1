const express= require('express');
const mysql= require('mysql2/promise');

//Connect to DB
const dbConfig= {
    user: process.env.DBUSER ?? 'root',
    password: process.env.DBPASSWORD ?? 'password',
    database: process.env.DBNAME ?? 'MiSolcito',
    host: process.env.DBHOST ?? 'localhost',
    port: process.env.DBPORT ?? '3306'
};
var dbConnection;
(async() => {
    try {
        dbConnection= await mysql.createConnection(dbConfig);
        console.log('Database: connected successfully');
    } catch (error) {
        console.log('Database: failed connection');
        console.log(error);
    }
})();
console.log(`DB config: `);
console.log(dbConfig);

//Express app
const app= express();

const PORT= process.env.PORT ?? 4000;

//Routes
app.use(express.urlencoded({extended: true}));

app.post('/api/messages', async(req, res) => {
    const { name, surname, email, message }= req.body;

    const exist= name && surname && email && message;
    if (!exist) {
        res.status(400).json({err: "Missing or empty properties"});
        return;
    }

    try {
        await dbConnection.execute('INSERT INTO userMessages (name, surname, email, message, ip) VALUES (?, ?, ?, ?, ?)', [name, surname, email, message, req.ip]);
        res.send();
    } catch (error) {
        //Handle ER_DATA_TOO_LONG
        if (error.code === 'ER_DATA_TOO_LONG') {
            res.status(400).json({err: `Too many characters on property: ${error.sqlMessage.match(/'(.*?)'/g)}`});
            return;
        }
        console.log(error);
        res.status(500).json({err: "The message was received but was not saved."});
    }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));