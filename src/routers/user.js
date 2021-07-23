const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');

const router = new express.Router();

router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const token = await user.generateAuthToken(user._id.toString());
        user.tokens.push({ token });
        await user.save();
        res.status(201).send({user, token});
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
} );

router.post('/users/login' , async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken(user._id.toString());
        user.tokens.push({ token });
        await user.save();
        res.send({user, token});
    } catch (e) {
        console.log(e);
        res.status(400).send()
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })
        await req.user.save();
        res.send('Successfully logged out');
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send('Logged out from all sessions');
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;
    try{
        const user = await User.findById(_id);
        if(!user)
            return res.status(404).send();
        res.send(user);
    } catch(e){
        res.status(500).send();
    }
});

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValid = updates.every((update) => allowedUpdates.includes(update));

    if(!isValid)
        return res.status(400).send({ error : 'Invalid Updates! '});
    try{
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.remove();
        res.send(req.user);
    } catch (e) {
        res.status(500).send();
    }
});


const upload = multer({
    dest : 'avatars',
    limits : {
        fileSize : 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
            return cb(new Error("Upload .jpg, .jpeg, .png"));
        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), (req, res) => {
    res.send('Avatar uploaded successfully');
}, (error, req, res, next) => {
    res.status(400).send({
        error : error.message
    })
});

module.exports = router;