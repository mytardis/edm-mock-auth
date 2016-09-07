'use strict';

const path = require('path');
const koa = require('koa');
const body = require('koa-body');
const Router = require('koa-router');
const mount = require('koa-mount');
const rewrite = require('koa-rewrite');
const render = require('koa-ejs');
const querystring = require('querystring');

// Get the configured port and let it be known which is assigned
const port = process.env.PORT || 5000;
console.log(`Fake Auth app will listen on port ${port}`);

const app = koa();

// This is used for HTML template rendering with koa-ejs
render(app, {
    cache: false,
    layout: '_layout',
    root: path.join(__dirname, 'views'),
});

// This is used for signing cookies
app.keys = [
    'd68141bd664a3f94ca4401e04532da5f0bec7fa3c95a6d335820a8dd694177c2',
    'ccc2defd5f92b49c08a551c41400d77a89317dc2d93fbfcc23ef5afc995d2968'
];

// This is the OIDC provider class
const Provider = require('oidc-provider').Provider;

const issuer = `http://localhost:${port}/op`;

// All configuration comes from here.
// Clients and certificates are defined in ./config/clients.js and ./config/certificates.js, respectively
const settings = require('./settings');

// Account database
const Account = require('./account');
settings.config.findById = Account.findById;

// An OIDC provider is instantiated
const oidc = new Provider(issuer, settings.config);

// Set up the configuration endpoint to expose the supported features and scopes
app.use(rewrite(/^\/\.well-known\/(.*)/, '/op/.well-known/$1'));
app.use(mount('/op', oidc.app));

const router = new Router();

// This is the route that is used after the /op/auth endpoint is touched. It displays the login prompt.
router.get('/interaction/:grant', function * renderInteraction(next) {
    const cookie = JSON.parse(this.cookies.get('_grant', { signed: true }));
    const client = yield oidc.get('Client').find(cookie.params.client_id);

    if (cookie.interaction.error === 'login_required') {
        yield this.render('login', {
            client,
            cookie,
            title: 'Sign-in',
            debug: querystring.stringify(cookie.params, ',<br/>', ' = ', {
                encodeURIComponent: (value) => value,
            }),
            interaction: querystring.stringify(cookie.interaction, ',<br/>', ' = ', {
                encodeURIComponent: (value) => value,
            }),
        });
    } else {
        yield this.render('interaction', {
            client,
            cookie,
            title: 'Authorize',
            debug: querystring.stringify(cookie.params, ',<br/>', ' = ', {
                encodeURIComponent: (value) => value,
            }),
            interaction: querystring.stringify(cookie.interaction, ',<br/>', ' = ', {
                encodeURIComponent: (value) => value,
            }),
        });
    }

    yield next;
});

// This is the route that handles login form submission and authorisation
router.post('/login', body(), function * submitLoginForm() {
    console.log(this.request.body);
    const account = yield Account.findByLogin(this.request.body.login);

    const result = {
        login: {
            account: account.accountId,
            acr: '1',
            remember: !!this.request.body.remember,
            ts: Date.now() / 1000 | 0,
        },
        consent: {},
    };

    oidc.resume(this, this.request.body.uuid, result);
});

router.post('/confirm', body, function * submitConfirmationForm(next) {
    const result = { consent: {} };
    oidc.resume(this, this.request.body.uuid, result);
    yield next;
});

// Add the routes to the app
app.use(router.routes());

// Add the client IDs and server certificates to the OIDC provider, and then start the app
Promise.all(settings.certificates.map(cert => oidc.addKey(cert)))
    .then(
        () => Promise.all(
            settings.clients.map(client => oidc.addClient(client)
            )
        ).catch(console.error)
    )
    .then(
        () => app.listen(port)
    );
