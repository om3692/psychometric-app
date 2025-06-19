const bcrypt = require('bcryptjs');

const passwordToHash = '9981231142om'; // <-- Put the desired password here
const saltRounds = 10;

bcrypt.hash(passwordToHash, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Your new hashed password is:');
    console.log(hash);
});