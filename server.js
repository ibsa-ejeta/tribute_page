const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
const https = require('https');
const _ = require('lodash');
const mongoose = require("mongoose");
const enforce = require("express-sslify");
const { json } = require('body-parser');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const math = require('math');
const fetch = require("node-fetch");

require('dotenv').config();

//
const app = express();
//app.use(enforce.HTTPS({ trustProtoHeader: true }));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(express.json());


const homeStartingContent = "In this journal, you can create and publish your own daily journals on subjects such as Web Development. Go to 'COMPOSE' enter the Journal's Title and Content on the space provided and click 'Publish'. Your Journal will be visible in the 'Home' page.";

const bloging = mongoose.createConnection("mongodb://localhost:27017/blogDB", {useNewUrlParser: true, useUnifiedTopology: true});
const surveying = mongoose.createConnection("mongodb://localhost:27017/surveyDB", {useNewUrlParser: true, useUnifiedTopology: true});

// const bloging = mongoose.createConnection(process.env.MONGODB_URI1, {useNewUrlParser: true, useUnifiedTopology: true});
// const surveying = mongoose.createConnection(process.env.MONGODB_URI2, {useNewUrlParser: true, useUnifiedTopology: true});

// Mongoose Schema
const blogsSchema = {
  title: String,
  content: String
};

const surveySchema = {
  fullname: String,
  email: String,
  age: Number,
  birthdate: String,
  countrycode: Number,
  phonenumber: Number,
  jobtitle: String,
  recommendation: String,
  bestproject: String,
  improve: Array,
  comments: String
};

const Blog = bloging.model("Blog", blogsSchema);
const Survey = surveying.model("Survey", surveySchema);

app.get('/', (req, res) => {
    res.render('homepage');
});


app.get('/Tribute_Page', (req, res) => {
    res.render('tribute');
});

app.get('/Survey_Form', async (req, res) => {

  let date = new Date();
  //console.log(date);
  let today = date.toDateString();
  const api_url = 'https://api.openweathermap.org/data/2.5/weather?appid=' + process.env.APPID  + '&q=Toronto&units=metric';
  const response = await fetch(api_url);
  const json1 = await response.json();
  let temperature = math.round(json1.main.temp);
  let imgIcon = json1.weather[0].icon;
  let imageIcon  = 'https://openweathermap.org/img/wn/' + imgIcon + '@2x.png';

  res.render('survey',
  {
    temperature: temperature,
    today: today,
    imageIcon: imageIcon
    });
});

app.get('/Landing_Page', (req, res) => {
    res.render('landing');
});

app.get('/Technical_Documentation', (req, res) => {
    res.render('technical');
});

app.get('/Personal_Page', (req, res) => {
  const location = "https://maps.googleapis.com/maps/api/js?key=" + process.env.LOCATION + "&callback=initMap";
  res.render('personal', {location:location});
});

app.get('/blog', (req, res) => {

  Blog.find({}, (err, posts) => {
      res.render("blogpost/home", {
        homeContent: homeStartingContent,
         posts: posts
        });
  });
});

app.get('/blog/about', (req, res) => {
  res.render('blogpost/about');
});

app.get('/blog/contact', (req, res) => {
  res.render('blogpost/contact');
});

app.get('/blog/compose', (req, res) => {
  res.render('blogpost/compose');
});
app.post('/blog/compose', (req, res) => {

  const blog = new Blog ({
    title: req.body.postTitle,
    content: req.body.postBody
  });
  blog.save(err => {
    if(!err) {
      res.redirect("/blog");
    }
  });
});

app.get('/blog/posts/:newPost', (req, res) => {
  const requestedPostId = req.params.newPost;
  Blog.findOne({_id:requestedPostId}, (err, post) => {
      if(err) {
        console.log(err);
      } else {
        res.render("blogpost/posts", {
          postTitle: post.title,
          postBody: post.content
        });
      }

  });
});

app.post('/Landing_Page', (req, res) => {
    const firstName = req.body.fName;
    const lastName = req.body.lName;
    const email = req.body.email;
    const data = {members: [
        {
            email_address: email,
            status: 'subscribed',
            merge_fields: {
                FNAME: firstName,
                LNAME: lastName
            }
        }
    ]}
    const jsonData = JSON.stringify(data);
    const url = 'https://us4.api.mailchimp.com/3.0/lists/' + process.env.URL1;
    const options = {

        method: 'POST',
        auth: 'anystring:' + process.env.API
    };
    const request = https.request(url, options, response => {
        if (response.statusCode === 200) {
            res.render('landing2');
        } else {
            res.render('landing3');
        }
        response.on('data', data => {
            // console.log(JSON.parse(data));
        });
    });
    request.write(jsonData);
    request.end();
});

app.post('/Tribute_Page', (req, res) => {
    let power = parseFloat(req.body.power);
    let dBm = Math.round(10 * Math.log10(power));
    res.render('tribute2', {power: power, dBm: dBm});

});

app.post('/Survey_Form', (req, res) => {
  const survey = new Survey ({
    fullname: req.body.fullname,
    email: req.body.email,
    age: req.body.age,
    birthdate: req.body.birthdate,
    countrycode: req.body.countrycode,
    phonenumber: req.body.phonenumber,
    jobtitle: req.body.jobtitle,
    recommendation: req.body.recommendation,
    bestproject: req.body.bestproject,
    improve: req.body.improve,
    comments: req.body.comments
  });

  survey.save(err => {
    if(!err) {
      res.send("Survey submitted successfully. Thank you for your time!");
    } else {
      console.log(err);
    }
  });
});

app.listen(process.env.PORT || 3000, () => {
    console.log('server started on port 3000!');
});
