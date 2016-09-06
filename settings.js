'use strict';

module.exports.clients = require('./config/clients').clients;
module.exports.certificates = require('./config/certificates').certificates;

module.exports.config = {
    claims: {
        address: {
            address: null,
        },
        email: {
            email: null,
            email_verified: null,
        },
        phone: {
            phone_number: null,
            phone_number_verified: null,
        },
        profile: {
            birthdate: null,
            family_name: null,
            gender: null,
            given_name: null,
            locale: null,
            middle_name: null,
            name: null,
            nickname: null,
            picture: null,
            preferred_username: null,
            profile: null,
            updated_at: null,
            website: null,
            zoneinfo: null,
        },
    },
    features: {
        claimsParameter: true,
        clientCredentials: true,
        encryption: true,
        introspection: true,
        registration: true,
        registrationManagement: false,
        request: true,
        requestUri: true,
        revocation: true,
        sessionManagement: true,
        backchannelLogout: true,
    },
    subjectTypes: ['public', 'pairwise'],
    pairwiseSalt: 'da1c442b365b563dfc121f285a11eedee5bbff7110d55c88',
};

