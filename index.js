const
	in_production = process.env.NODE_ENV === 'production',
	PORT = process.env.PORT || 8000;

const
	express	= require('express'),
	expressSession = require('express-session'),
    app = express(),
    config = require('./config/config'),
    mongoose = require('mongoose'),
	body_parser	= require('body-parser'),
	path = require('path');

const CACHE_GENERATOR_INTERVAL_TIME = 60 * 60 * 1000;

app.use(expressSession({secret: config.sessionSecret, resave: false, saveUninitialized: false }));
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

mongoose.connect(config.mongoURI);
require('./models/cachedGame');
require('./models/cachedEvent');
require('./models/revealedData');

app.use('/reveal', require('./routes/revealRoutes'));
app.use('/games', require('./routes/gamesRoutes'));

const { restartCacheGenerator } = require('./cacheGenerator');

restartCacheGenerator().then(() => {
	setInterval(restartCacheGenerator, CACHE_GENERATOR_INTERVAL_TIME);
	if (in_production) {
		app.use(express.static('client/build'));
		app.get('*', (req, res) => {
			res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
		});
	}
	app.listen(PORT, () => console.log( (in_production ? 'Prod' : 'Dev') + ' SERVER active on port ' + PORT));
});