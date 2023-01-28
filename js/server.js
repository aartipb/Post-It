// Dependencies
const express = require('express')
const bcrypt = require('bcrypt')
const fs = require('fs').promises
const {MongoClient} = require('mongodb')
const path = require('path');
const assert = require('assert');

// App and middleware setup
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, '/../css')));

// Port, MongoDB URI, and curuser variable for storing which user in in login session
const port = 3000
const htmlPath = path.join(__dirname, '/../html')

// Create MongoClient and pool connections
const uri = "mongodb+srv://textUser:notestime@cluster0.laaax.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useUnifiedTopology:true })
client.connect(function(err) {
    assert.strictEqual(null, err);
    console.log("Connected successfully to Mongo server");
});

// Variable to keep track of current user in session
var curuser = {}


// Index page
// First thing displayed
app.get('/', (req, res) => {
    fs.readFile(htmlPath + "/index.html")
        .then(contents => {
            res.setHeader("Content-Type", "text/html")
            res.writeHead(200)
            res.end(contents)
        })
        .catch(err => {
            res.writeHead(500)
            res.end(err)
            return
        })
})

// Page to find a user
// Get to this from index.html
app.get('/find', (req, res) => {
    fs.readFile(htmlPath + "/find.html")
        .then(contents => {
            res.setHeader("Content-Type", "text/html")
            res.writeHead(200)
            res.end(contents)
        })
        .catch(err => {
            res.writeHead(500)
            res.end(err)
            return
        })
})


// Display login page
// Get to this from index.html
app.get('/login', (req, res) => {
    fs.readFile(htmlPath + "/login.html")
        .then(contents => {
            res.setHeader("Content-Type", "text/html")
            res.writeHead(200)
            res.end(contents)
        })
        .catch(err => {
            res.writeHead(500)
            res.end(err)
            return
        })
})

// Display a cool looking page
// Get to this from index.html
app.get('/coolpage', (req, res) => {
    fs.readFile(htmlPath + "/cool_page.html")
        .then(contents => {
            res.setHeader("Content-Type", "text/html")
            res.writeHead(200)
            res.end(contents)
        })
        .catch(err => {
            res.writeHead(500)
            res.end(err)
            return
        })
})

// Display a cool looking page
// Get to this from index.html
app.get('/textpage', (req, res) => {
    fs.readFile(htmlPath + "/textpage.html")
        .then(contents => {
            res.setHeader("Content-Type", "text/html")
            res.writeHead(200)
            res.end(contents)
        })
        .catch(err => {
            res.writeHead(500)
            res.end(err)
            return
        })
})

// Page to create a user
// Get to this from index.html
app.get('/user_creation', (req, res) => {
    fs.readFile(htmlPath + "/user_creation.html")
        .then(contents => {
            res.setHeader("Content-Type", "text/html")
            res.writeHead(200)
            res.end(contents)
        })
        .catch(err => {
            res.writeHead(500)
            res.end(err)
            return
        })
})

// Page to create a user
// Get to this from index.html
app.get('/db_delete', (req, res) => {
    fs.readFile(htmlPath + "/db_delete.html")
        .then(contents => {
            res.setHeader("Content-Type", "text/html")
            res.writeHead(200)
            res.end(contents)
        })
        .catch(err => {
            res.writeHead(500)
            res.end(err)
            return
        })
})

// Store the username and password in MongoDB
// Get to this from user_creation.html
app.post('/users', async (req, res) => {
    try{
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(req.body.psw, salt)
        const user = {created_at: new Date(), name: req.body.fname, password: hashedPassword, text: ""}
        try{
            const dbuser = await client.db("users").collection("information").findOne({ name: user.name })
            if (dbuser) {
                res.status(400).send("error1")
            } 
            else {
                try{
                    await client.db("users").collection("information").insertOne(user)
                    await client.db("users").collection("information").createIndex(
                        { created_at: 1 },
                        { expireAfterSeconds: 86400 }
                    )
                    res.status(200).send()

                    //res.redirect("/")

                } catch(e){
                    console.error(e)
                }
            }
        } catch(e){
            console.error(e)
        }
    } catch {
        res.status(500).send()
    }
})


// Code to actually check login input (only accepts distinct usernames)
// Get to this from login.html
app.post('/login_check', async (req, res) => {
    var reques = req.body.fname
    try {
        const user = await client.db("users").collection("information").findOne({ name: reques })
        if (user) {
            try{
                if(await bcrypt.compare(req.body.psw, user.password)){
                    curuser = {name: user.name}
                    //res.redirect("/textpage")
                    res.status(200).send()
                }
                else{
                    //res.send("Wrong password")
                    res.status(500).send('showAlert')
                }
            } catch {
                res.status(500).send()
            }
        } else {
            //res.send("No user found")
            res.status(500).send('random')
        }
    } catch(e){
        console.error(e)
    }
})


// Code to actually check if user exists
// Get to this from find.html
app.post('/user_exists_check', async (req, res) => {
    var name_to_check = req.body.name
    try {
        const user = await client.db("users").collection("information").findOne({ name: name_to_check })

        if (user) {
            res.send(true)
        } else {
            res.send(false)
        }
    } catch(e){
        console.error(e)
    }
})

// Stores user text in MongoDB
// Get to this from textpage.html
app.post('/process_stuff', async (req, res) => {
    try{
        await client.db("users").collection("information")
        .updateOne({ name: curuser.name }, { $set: {created_at: new Date(), text: req.body.notes} })
    } catch(e){
        console.error(e)
    }
    res.redirect("/")
})




// Returns curuser to textpage.html
app.get('/data', async (req, res) => {
    try{
        const user = await client.db("users").collection("information").findOne({ name: curuser.name })
        if (user) {
            res.send(user.text)
        } else {
            res.status(400).send("Unable to find user")
        }
    } catch(e){
        console.error(e)
    }
})

// Deletes all entries in MongoDB
app.get('/delete', async (req, res) => {
    try{
        const user = await client.db("users").collection("information").deleteMany({})
    } catch(e){
        console.error(e)
        res.send(false)
    }
    res.send(true)
})




// Specifies which localhost port to use
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})