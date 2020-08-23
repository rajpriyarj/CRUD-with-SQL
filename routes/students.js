const express = require('express');
const router = express.Router();
const bcrypt  = require('bcrypt');
const {to} = require('await-to-js');
const jwt = require('jsonwebtoken');
var validator = require("email-validator");
const mysql = require('./../lib/datacenter/mysql/connection');
const {checkToken} = require('./../middlewares/index');


router.get('/', async (req, res)=>{
    let query = 'SELECT * FROM students';
    let [err, result] = await to(mysql.executeQuery(query));
    if (err){
        return res.json({
            data: null,
            error: "Error!!!"
        });
    }
    res.json({
        data: result,
        error: null
    })
})

router.get('/:id', checkToken, async (req, res)=>{
    studentId = req.params.id;
    let [err, result] = await to(mysql.executeQuery(`SELECT * FROM students where id = ${req.params.id}`));
    if (err){
        return res.json({
            data: null,
            error: "Error!!!"
        })
    }
    if  (result.length === 0){
        return res.json({
            error: ` No student exist with id ${studentId} exist`
        });
    }
    res.json({
        data: result,
        error: null
    });
});

router.post('/signup', async (req, res)=>{
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    if(!username || !email ||!password ||!validator.validate(email)){
        return res.send({
            error: "Invalid Payload"
        });
    }

    let [err, result] = await to(mysql.executeQuery(`SELECT * FROM students`));
    let studentId = result.length + 1;

    let encryptedPassword = await passwordHash(password);
    [err, result] = await to(mysql.executeQuery(`INSERT INTO students VALUES (${studentId}, "${username}", "${email}", "${encryptedPassword}")`));

    if(err){
        if(err.code === "ER_DUP_ENTRY"){
            res.json({
                success: false,
                error: "This email id already exist."
            });
        } else{
            res.json({
                success: false,
                error: "Some error occurred."
            });
        }
    }else{
        res.json({
            data:"Success",
            error: null
        })
    }

});

router.post('/login', async (req, res)=> {
    let email = req.body.email;
    let password = req.body.password;
    if(!email){
        return res.json({"error": "email is required "})
    }
    if(!password){
        return res.json({"error": "Password is required "})
    }
    let[err, result] = await to(mysql.executeQuery(`SELECT * FROM students WHERE email = '${email}'`));
    if (err) {
        res.json({
            data: null,
            error: "Error in query"
        });
    }
    if (result.length === 0) {
        return res.json({
            data: null,
            error: "Invalid email or password"
        })
    }

    [err, isValid] = await to(bcrypt.compare(password, result[0].password));
    if(err) {
        return res.json({
            data: null,
            error: 'invalid password'
        });
    }
    if (isValid) {
        const user = {
            id: result[0].id,
            name: result[0].name,
            email: email
        };
        return res.json({
            success: true,
            token: generateToken(user),
            error: null
        });
    }

});

const passwordHash = async (password) => {
    const saltRounds = 12;
    const [err, passwordHash] = await to(bcrypt.hash(password, saltRounds));
    if (err) {
        logger.error('Error while generating password hash', { error: err });
        throw Error('Error while generating password hash');
    }
    return passwordHash;
};

let salt = 'ZGV2c25lc3QK';

const generateToken  = (userData) => {
    let token = jwt.sign(userData, salt, {
        expiresIn: 172800000,
    });
    return token;
};


module.exports = router;