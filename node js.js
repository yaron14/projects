// Written By Yaron Lerner

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mysql = require('mysql');
var path = require('path');
var exec = require("child_process").exec;
var ini = require('ini');
var fs = require('fs');
var sleep = require('system-sleep');

app.use(bodyParser.json()); // to support JSON bodies
var urlencodedParser = bodyParser.urlencoded({ extended: true });  // to support URL-encoded bodies


// gets and reads the file index.html
app.get('/', function (req, res) {
  	res.sendFile(path.resolve(__dirname, "./UI/index.html"));
  	app.use(express.static('./UI/'));
});

// port the app is on
app.listen(8081);
var serverAddress = "http://localhost:" + 8081;
console.log('Server started! At ' + serverAddress);
exec("start " + serverAddress);

// config var, reads what is inside config.ini file
var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
// assign vars to match the vars in the ini file
var host = config.database["host"];
var db = config.database["schema"];
var user = config.database["user"];
var password = config.database["password"];

// the response we get from the html file inputs form
app.post('/greatSuccess', urlencodedParser, function (req, res) {
   // Prepare output in JSON format
   var response = {
        _dg: req.body.DeployGroup,
        _keepOlderForFlash: req.body.KeepOlderForFlash,
        _keepOlderForDownload: req.body.KeepOlderForDownload,
        _keepNewerForDownload: req.body.KeepNewerForDownload
	};
    console.log(JSON.stringify(response));
    var input_DG = response._dg; // var that contains all deploy groups
    var arrayDG = input_DG.split(', '); // var that seperates every DG by ', ' and put all of them in an array
    console.log(arrayDG);

    // loop through the DGs array, and one by one sends them to the query
    for (var index = 0; index < arrayDG.length; index++){
        // console.log("Running Deploy Group: " + JSON.parse(arrayDG[index]));

        // create connection to the database with the vars that in the ini file	   
        var con = mysql.createConnection({
            host: host,
            database: db,
            user: user,
            password: password
        });
        // connect to the database
        con.connect(function(err){
            if (err) throw err;
            console.log("Connected to Database");
        });
        // call the stored procedure with the input values we received from the user (are found under response object)
        // the values contains "" so in order to put them off and call the procedure properly, I parsed every value
        con.query('CALL sp_bo_ios_flash_to_dg_test(?,?,?,?)', 
            [JSON.parse(arrayDG[index]),JSON.parse(response._keepOlderForFlash),JSON.parse(response._keepOlderForDownload), JSON.parse(response._keepNewerForDownload)],
        function(err, result){
            if (err) throw err;
            console.log("Procedure executed for deploy group " + JSON.parse(arrayDG[index]));
        });
        // ends connection
        con.end(function(err){
            if (err) throw err;
    	});
        sleep(2500);
    };
	// ends response with success
    console.log('Closing Connection...');

	// res.end("Great Success!");
    res.sendFile(path.resolve(__dirname, "./UI/greatSuccess.html"));
});
