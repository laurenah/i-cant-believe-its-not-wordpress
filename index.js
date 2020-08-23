require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const {
    ExpressOIDC
} = require('@okta/oidc-middleware');
const Sequelize = require('sequelize');
const epilogue = require('epilogue'), ForbiddenError = epilogue.Errors.ForbiddenError;
const app = express();
const port = 8080;

// session support is required to use ExpressOIDC
app.use(session({
    secret: process.env.RANDOM_SECRET_WORD,
    resave: true,
    saveUninitialized: false
}));

const oidc = new ExpressOIDC({
    appBaseUrl: process.env.OKTA_BASEAPP_URL,
    issuer: `${process.env.OKTA_ORG_URL}/oauth2/default`,
    client_id: process.env.OKTA_CLIENT_ID,
    client_secret: process.env.OKTA_CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URL,
    scope: 'openid profile',
    routes: {
        callback: {
            path: '/authorization-code/callback',
            defaultRedirect: '/admin'
        }
    }
});

// ExpressOIDC will attach handlers for the /login and /authorization-code/callback routes
app.use(oidc.router);
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// login page
app.get('/home', (req, res) => {
    //res.sendFile(path.join(__dirname, './public/home.html'));
    res.send('<a href="/login">Login</a>');
});

// admin page
app.get('/admin', (req, res) => {
    if (req.isAuthenticated()) { // if user is authenticated, send admin page
        res.send('admin page');
        //res.sendFile(path.join(__dirname, './public/admin.html'))
    } else { // otherwise redirect back to main page
        res.redirect('/');
    }
});

// logout route - redirects to main page on logout
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});


app.listen(port, () => console.log(`app listening on port ${port}`))
