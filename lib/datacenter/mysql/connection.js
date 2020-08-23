const mysql = require('mysql');
let connection;
const connectDB = () => {
    return new Promise((resolve, reject) => {
        connection = mysql.createConnection({
            host : 'localhost',
            user : 'root',
            password : 'Rj12345@',
            database : 'CRUD'
        });
        connection.connect(function (err, res){
            if(err){
                console.log("Connected")
                return reject(new Error(err.message));
            }
            return resolve('Successfully connected to database!')
        });
        return true;
    });
};

const executeQuery = (query) => {
    return new Promise((resolve, reject) => {
        connection.query(query, (err, result, fields) =>{
            if(err) {
                return reject(err)
            }
            return resolve(result)
        });
    });
};

module.exports = {
    connectDB,
    executeQuery
}