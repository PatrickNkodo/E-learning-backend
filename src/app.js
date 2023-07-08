	const userRoute = require('./routers/userRoute');
	const courseRoute = require('./routers/courseRoute');
	const cors = require('cors');
	const express = require('express');
	const app = express();
	app.use(express.json()); //to parse all incoming data to JSON
    app.use(cors({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }))
	/*To enable cors for a single route, add it as the 2nd parameter like this
        app.post('/route,cors(),(req,res)=>{

        })
    */
	app.use(userRoute); //use the routes file for the app endpoints
	app.use(courseRoute); //use the routes file for the app endpoints
	app.listen(4000, () => {
		console.log('App set on port 4000');
	});
	/*
    // allow multiple origins
        app.use((req, res, next) => {
        const allowedOrigins = ['www.example1.com', 'www.example2.com', 'www.example3.com'];
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        return next();
    });
    // Allow some methods
        res.header('Access-Control-Allow-Methods', 'GET, POST');
    */
