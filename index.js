const
	in_production = process.env.NODE_ENV === 'production',
	PORT = in_production ? 80 : 8000;

const
	express	= require('express'),
	expressSession = require('express-session'),
    app = express(),
    config = require('./config/config'),
    mongoose = require('mongoose');
	body_parser	= require('body-parser');

app.use(expressSession({secret: config.sessionSecret, resave: false, saveUninitialized: false }));
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

mongoose.connect(config.mongoURI);
require('./models/cachedGame');
require('./models/cachedEvent');

app.use('/reveal', require('./routes/revealRoutes'));
app.use('/games', require('./routes/gamesRoutes'));

const initBlockchainConnection = require('./initBlockchainConnection');

initBlockchainConnection().then(() => {
	app.listen(PORT, () => console.log( (in_production ? 'Prod' : 'Dev') + ' SERVER active on port ' + PORT));
});