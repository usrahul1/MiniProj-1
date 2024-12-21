const express = require('express')
const app = express()
const path = require('path')
const mongo = require('./models/user')
const post = require('./models/post')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const user = require('./models/user')
const upload = require('./config/multerconfig')

app.set("view engine", "ejs")

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/prof", isLoggedIn, (req, res)=>{
    res.render("prof")
})

app.post("/profupload", upload.single('file') , isLoggedIn, async (req, res)=>{
    let user1 = await user.findOne({email: req.user.email})
    user1.profilepic = req.file.filename
    await user1.save()
    res.redirect("/profile")
})

app.post("/create", async (req, res) => {
    let {name, age, email, password} = req.body
    let user = await mongo.findOne({email: req.body.email})
    if(user) return res.send("Already registered!")
    
    bcrypt.genSalt(10, (err, salt) =>{
        bcrypt.hash(password, salt, async (err, hash)=>{
            let user = await mongo.create({
                name,
                email,
                age,
                password: hash
            })
            res.redirect("/login")
        })
    })
})

app.post("/login", async (req, res)=>{
    let user = await mongo.findOne({email: req.body.email})
    if(!user) return res.render("login")
    
    let result = bcrypt.compare(req.body.password, user.password)
    if(result){ 
        let token = jwt.sign({email: req.body.email, userid: user._id}, "secret")
        res.cookie("token", token)
        res.redirect("/profile")
    }
    else res.send("something went wrong!")
})

app.get('/logout', (req, res) => {
    res.cookie("token", "")
    res.redirect("/")
})

app.get("/profile", isLoggedIn, async (req, res) => {
    let user = await mongo.findOne({email: req.user.email}).populate("post")
    console.log(user.profilepic)
    res.render("profile", {user})
})

app.post("/createpost", isLoggedIn, async (req, res) => {
    let user = await mongo.findOne({email: req.user.email})
    let postbyUser = await post.create({
        user: user._id,
        content: req.body.content
    })
    user.post.push(postbyUser._id)
    await user.save()
    console.log(postbyUser)
    console.log(user)
    res.redirect("/profile")
})

app.get("/like/:id", isLoggedIn, async (req, res) => {
    let postt = await post.findOne({_id: req.params.id}).populate("user")
    let userr = await user.findOne({email: req.user.email})
    console.log(userr._id)

    if(postt.likes.indexOf(userr._id) === -1){
        postt.likes.push(userr._id)
    } else {
        postt.likes.splice({_id: userr._id}, 1)
    }

    await postt.save()
    res.redirect("/profile")
})

app.get("/edit/:postid", isLoggedIn, async (req, res) => {
    let postofUser = await post.findOne({_id: req.params.postid})
    console.log(postofUser)
    res.render("edit", {postofUser})
})

app.get("/delete/:postid", isLoggedIn, async (req, res)=>{
    let user = await mongo.findOne({email: req.user.email})
    console.log(req.user.email)
    await post.findOneAndDelete({_id: req.params.postid})
    user.post.splice(user.post.indexOf(req.params.postid), 1)
    await user.save()
    res.redirect("/profile")
})

app.post("/editpost/:postid", isLoggedIn, async (req, res) => {
    await post.findOneAndUpdate({_id: req.params.postid}, {content: req.body.content})
    res.redirect("/profile")
})

function isLoggedIn(req, res, next) {
    if(res.token === "") res.send("You must be logged in!")
    else {
        let data = jwt.verify(req.cookies.token, "secret")
        req.user = data
    }
    next()
}

app.listen(3000)
