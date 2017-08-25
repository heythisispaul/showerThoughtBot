// DEPENDENCIES
"use strict";
const cheerio    = require("cheerio");
const request    = require("request");
const Nightmare  = require('nightmare');
const nightmare  = Nightmare({ show: false });
const loginInfo  = require("./loginInfo.js");

console.log("scraping...");
var redditPosts = [];
var title; 
var author;

setInterval(function() {
  const redditPromise = new Promise((resolve, reject) => {
    // PULLS HTML FILE FROM REDDIT
    request("https://www.reddit.com/r/showerthoughts", function(error, response, html) {
      var $ = cheerio.load(html);
    // SELECTED DIV THAT HOLDS EACH POST - LOOPS THROUGH THEM IN CASE THE FIRST HAS MORE THAN 140 CHARACTERS
      $("div.top-matter").each(function(i, element) {
        title = $(element).find("p.title").text();
        author = $(element).find("a.author").text();
    // PUSHES THE SELECTIONS TO THE RESULTS ARRAY WHICH HOLDS THE DATA TO BE SENT TO TWITTER
        redditPosts.push({
          title: title,
          author: author
        });
      });
      resolve(redditPosts);
    });
  });

  // RUN THIS PROMISE ONCE DATA IS COLLECTED, PASSES THE REDDIT POST ARRAY TO BE USED BY NIGHTMARE TO POST.
  redditPromise.then(function(resolved) {
  // VARIABLE TO HOLD WHAT WILL ULTIMATELY BE PASSED TO NIGHTMARE.
    let showerThought;
  // RUN THROUGH THE ARRAY OF REDDIT POSTS AND FIND THE FIRST FULL POST THAT'S LESS THAN 140 CHARACTERS.
      for (let i = 0; i <= resolved.length; i++) {
        let post = resolved[i].title.toString().replace(' (self.Showerthoughts)', '');
        let poster = resolved[i].author.toString();
        let fullPost = `${post} -/u/${poster}`
        let lenTest = fullPost.length;
        if ( lenTest < 140 ) {
          showerThought = fullPost;
          console.log("meow" + showerThought);
          // NIGHTMARE LOADS TWITTER AND ENTERS THE LOGIN INFORMATION AND DATA SCRAPED FROM REDDIT.
          nightmare
          .goto('https://twitter.com/intent/tweet')
          .insert('#username_or_email', loginInfo.email)
          .wait(1000)
          .insert('#password', loginInfo.password)
          .wait(1000)
          .type('#status', showerThought)
          .wait(1000)
          .click(".button")
          .wait(2000)
          .end()
          .then(function (result) {
            console.log("successfully posted: " + showerThought);
          })
          .catch(function (error) {
          console.error('Search failed:', error);
          });
          break;
        } else {
  // DO NOTHING IF ALL POSTS ARE TOO LONG.
          return console.log("uh oh they're all too long");
        }
      }
  });
  // RUNS ONCE AN HOUR. TWITTER WILL BLOCK THE TWEET IF IT'S THE SAME AS THE ONE POSTED BFORE ON IT'S OWN.
},3600000);
