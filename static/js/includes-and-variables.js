/* ------------------------------
S T O P   W O R D S   C O R P U S
-------------------------------*/
const STOPWORDS = new Array("a","about","above","after","again","against","all","am","an","and","any","are","aren't","as","at","be","because","been","before","being","below","between","both","but","by","can't","cannot","could","couldn't","did","didn't","do","does","doesn't","doing","don't","down","during","each","few","for","from","further","had","hadn't","has","hasn't","have","haven't","having","he","he'd","he'll","he's","her","here","here's","hers","herself","him","himself","his","how","how's","i","i'd","i'll","i'm","i've","if","in","into","is","isn't","it","it's","its","itself","let's","me","more","most","mustn't","my","myself","no","nor","not","of","off","on","once","only","or","other","ought","our","ours","ourselves","out","over","own","said","same","shan't","she","she'd","she'll","she's","should","shouldn't","so","some","such","than","that","that's","the","their","theirs","them","themselves","then","there","there's","these","they","they'd","they'll","they're","they've","this","those","through","to","too","under","until","up","very","was","wasn't","we","we'd","we'll","we're","we've","were","weren't","what","what's","when","when's","where","where's","which","while","who","who's","whom","why","why's","will","with","won't","would","wouldn't","you","you'd","you'll","you're","you've","your","yours","yourself","yourselves");
// Define the stopwords to be used when removing from article for article summarisation

/* -----------------------------
C O O K I E   F U N C T I O N S
------------------------------*/
function getCookie(name) {                                        // Retrieves cookie, given cookie name
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");                     // Search for cookie, using split method
  if (parts.length == 2) return parts.pop().split(";").shift();   // Return the value of cookie, if exists
}

function removeCookies() {                                        // Remove cookies sets all the cookies
  var multiple = document.cookie.split(";");                      // to expire, causing them to be
  for(var i = 0; i < multiple.length; i++) {                      // removed from the browser
  	var key = multiple[i].split("=");
      document.cookie = key[0]+" =; expires = Thu, 01 Jan 1970 00:00:00 UTC";
  }
}

function signOut() {                                            // Signout function removes all cookies
  removeCookies();                                              // and navigates user back to sign in page
  app.router.navigate("/signin/", {reloadAll: true, ignoreCache: true});
}


/* -----------------------
D O M   F U N C T I O N S
------------------------*/
function addCard(article, ind) {
  if(article.getData("photo") != "") {              // Append different styled cards depending on whether article has photo
    return `<br>
      <div class="card card-header-pic">
      <div style="background-image:url(` + article.getData("photo") +
      `)" class="card-header align-items-flex-end"><h3 id="title"><a href='/article-template7/` +
      app.data.user.getArticleIndex(article) + `/' onclick="app.preloader.show('pink')" class="no-link text-color-white">` +
      article.getData("title").replace(/[\u2018\u2019]/g, "'") + `</a></h3></div> <div class="card-content card-content-padding">
      <p class="date">` + article.getData("date") + `</p>
      </div>
      <div class="card-footer">
      <div class="row">
      <div class="col-24">
      ` + addChip(article.getData("vendor")) + `
      </div>
      <div class="col 76">
      </div>
      </div>
      </div>
    `;
  }
  else {
    return `<br>
      <div class="card">
        <div class="card-header"><h3 class="no-padding-top"><a href="/article-template7/` + app.data.user.getArticleIndex(article) +
        `/" onclick="app.preloader.show('pink')" class="no-link text-color-black">` +
        article.getData("title").replace(/[\u2018\u2019]/g, "'") + `</a></h3></div>
        <div class="card-content card-content-padding"><p class="date">` + article.getData("date") + `</p></div>
        <div class="card-footer">
          <div class="row">
              <div class="col-24">
              ` + addChip(article.getData("vendor")) + `
              </div>
            </div>
          </div>
      </div>
    `;
  }
}

function addChip(text) {
  return `<a class="chip color-pink" id="` + {
    "BBC News": "bbc",
    "The Guardian": "guardian",
    "Pitchfork": "pitchfork",
    "Washington Post": "washington",
    "TechCrunch": "techcrunch",
    "National Geographic": "natgeo",
    "WIRED": "wired",
    "New York Times": "washington",
    "ESPN": "bbc",
    "WIRED": "wired",
    "National Geographic": "natgeo",
    "BBC Sport": "bbcsport",
    "HuffPost": "huffpost",
    "The Verge": "verge",
    "Scientific American": "sciusa",
    "Variety": "variety",
    "Daily Mail": "daily",
  }[text] + `" href="/category/` + text + `/"><div class="chip-label">` + text + `</div></a>`
}

function timeSince(date) {                                // Measures the time elapsed
  let seconds = Math.floor((new Date() - date) / 1000);   // since an article was
                                                          // published. Takes a date
  let interval = Math.floor(seconds / 31536000);          // object as a parameter
  if (interval > 1) {
    return interval + " years";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}


function getTrendingTopics() {                          // Populates the trending topic block with
  $.getJSON("/api/getTrending/", function(result) {     // a selection of keywords which are most
    result.forEach(function(topic) {                    // frequent in the database, fetched from
      $("#trending").append(addChip(topic));            // the backend.
    })
  })
}

function toggleContent(index) {                           // Show/hide the article content/summary
  $("#show-" + index + "-content").fadeToggle();
  $("#show-" + index + "-sumcontent").fadeToggle();
  $("#article-" + index + "-content").fadeToggle();
  $("#article-" + index + "-sumcontent").fadeToggle();
}

/* ---------------------------
S O C I A L  M E D I A  A P I
----------------------------*/
function onGoogle(googleuser) {
  var googleID = googleuser.getAuthResponse().id_token;

  var auth2 = gapi.auth2.getAuthInstance();
  auth2.disconnect();

  $.ajax({                        // Initialise an AJAX post request
    type : "POST",                // Send form data to the server API's signupuser
    url : "/api/googlesignin/",     // route, where the database actions needed to
    data: {"googleID": googleID},   // create a user will be completed
    success: function(object) {           // Upon return from server
      let parsed = JSON.parse(object);
      if(parsed["code"] == 200) {         // If user signed up successfully
        location.reload();
      } else {   // Otherwise
        app.toast.show({           // Generate an alert making the
          text: parsed['message'],        // user aware of the problem that
          closeTimeout: 5000,             // occurred
          destroyOnClose: true,
        });
      }
    }
  });
}

/* ------------------------------
C L A S S   D E F I N I T I O N S
-------------------------------*/
class Matrix {                            // Matrix object - contains object useful for matrices
  constructor(length, initial = 0) {      // Run on object initialisation
    this.length = length;                    // No. of rows/columns in the matrix
    this.arr = new Array(length).fill(new Array(length).fill(initial)); // Create the matrix, modelled as an array
  }

  assign (x, y, val) {       // Encapuslate the array with assign method, takes value and index as parameters
    this.arr[x][y] = val;       // Assign the value of val to the index of this.arr (x, y)
  }

  increment(x,y = undefined, int = undefined) {    // Increment the value of a specific index
    if(y != undefined || int != undefined) {       // If incrementing a matrix
      this.arr[x][y] += int;                       // Increment value at index x,y by value int
    } else {                                       // Otherwise, if incrementing a vector
      this.arr[x] += 1;                            // Increment value at index x, by 1
    }
  }

  setRow(index, row) {                             // Set row allows for whole row of matrix to
    this.arr[index] = row;                         // be defined at once
  }

  val() {                 // Getter method for returning the values in the matrix
    return this.arr;
  }

  len() {                        // Method to retrieve the length of the matrix, used for external
    return this.length;          // encapsulation purposes;
  }
}

class Vector extends Matrix {             // Vector method inherits methods and attributes from the Matrix object
  constructor(length, initial = 0) {      // Initialisation constructor, runs on Object initialisation
    super();                              // Set method to super, to override the parent class' constructor
    this.length = length;
    this.arr = new Array(length).fill(initial);   // Change the value of this.arr to just a 1D array
  }

  assign(x, val) {
    this.arr[x] = val;
  }

  magnitude() {                                 // Get the magnitude of the vector
    return Math.sqrt(this.arr.reduce((a, b) => a + (b * b), 0));
  }

  dotProd(vector) {          // Return the dot product of two vectors = the sum of the product of equal vector indexes
    vector = vector.val();
    return this.arr.reduce((a, b, i) => a + (b * vector[i]), 0);
  }
}


class Article {                                // Article object represents a single news article
  constructor(json) {                          // Run upon the initialisation of an object
    this.data = json["data"];
    this.sentences = [];                     // Sentence attribute, will hold Sentence object for every sentence
    this.keywords = json["keywords"];        // Stores article keywords, if fetched - otherwise just empty array
    this.data['interest'] = app.data.user.interestLevel(this.keywords);
  }

  normalise() {                              // Normalise the sentences in the article
    // let replacements = { "U.S ": "US ", "U.K ": "UK ", "U.S. ": "US " }
    // this.data['content'] = this.data['content'].replace(new RegExp(Object.keys(replacements).join("|"),"gi"), function(matched){
    //   return replacements[matched];
    // });

    let sentences = this.data['content'].match(/([^\.!\?]+[\.!\?]+)|([^\.!\?]+$)/g);  // Split into sentences

    for(let i = 0; i < sentences.length; i++) {
      this.sentences.push(new Sentence(sentences[i], i));     // For each sentence in the article, create an
    }                                                         // instance of the sentence class to represent it

    this.sentences = this.sentences.filter(x => x.len > 3);   // Define the sentences attribute as a sentence
  }                                                           // object for each sentence greater than 2 words

  getSentence(index) {                        // Retrieves a sentence, given the index of it
    return this.sentences[index].full;
  }

  getData(key) {
    if(key != "date") {
      return this.data[key];
    }

    return "Published " + timeSince(new Date(this.data["date"])) + " ago"
  }

  setData(key, value) {
    this.data[key] = value;
  }

  getKeywords() {                             // Returns the array of article keywords
    return this.keywords;
  }

  fetchContent(index) {       // Fetch article content, static so can be used outside of Object
    let usr = this;                                  // initialisation, just as a class
    $.ajaxSetup({ async: false });
    $.getJSON("api/fetcharticlecontent/" + index + "/", function(result) {
      usr.data["content"] = result["content"];                           // Set content variable equal to result from request
    });
    $.ajaxSetup({ async: true });
  }

  sents() {                                 // For encapsulation purposes, a getter method for fetching the array of
    return this.sentences.filter(function(obj) { return obj.s.length > 2 });            // sentences in the article
  }

  len() {                         // Get the length of the sentences
    return this.sents().length;   // Returns the length of the sentences returned from the sents() method
  }
}


class Sentence {                          // Sentence object - initialised for each sentence in article
  constructor(sentence, ind) {            // Runs upon initialisation, takes sentence content and index as parameters
    this.s = this.normalise(sentence);    // The normalised sentence content
    this.full = sentence;                 // The full sentence content
    this.index = ind;                     // Index of sentence in article
    this.len = this.words().length;       // No. of words in the article
  }

  words() {                   // Return each word from the sentence, in an array
    return this.s.split(" ").filter(function(obj) { return obj != ""});
  }

  normalise(sentence) {       // Normalise the sentence
    // Strip punctuation from sentence and unnecessary white space
    sentence = sentence.replace(/[.,\/#!$%\^&\*;:{}=_`~()]/g,"").replace(/\s{2,}/g," ");

    // Convert sentence all to lowercase
    sentence = sentence.toLowerCase();

    // Remove any stop words
    let normalised = "";

    for(let i = 0, split = sentence.split(" "); i < split.length; i++) {
      if(STOPWORDS.indexOf(split[i]) == -1) {
        normalised += (split[i] + " ");
      }
    }

    // Return the normalised sentence - removing the final whitespace added after removal of stop words
    return normalised.slice(0, normalised.length - 1);
  }

  length() {
    return this.len;
  }
}


class User {        // The user object, initalised on signin and constant between sessions
  constructor() {   // Run on object initialisation
    if(this.checkSessionID() == true) {           // Check if there is a session ID cookie present
      this.sessionID = getCookie("sessionID");    // Fetch sessionID from cookie
      this.user = getCookie("user");              // Fetch the username from cookie
      this.articles = [];
      this.toAdjust = {"sessionID": this.sessionID, "interests": {"increment": [], "create": [], "decrement": [], "delete": []},
                       "vendors": {"increment": [], "decrement": [], "delete": []}};
      this.front = 0;
      this.fetchPreferences();   // Get the user's preferences (interests, vendor preferences etc)
    }
  }

  getInterests() {                                                // Getter method to return user interests
    let interests = this.preferences["interests"];                // Encapsulating the user's preferences
    return Object.keys(interests);
  }

  initialPreferences() {
    for(let i = 0, els = $('#initialPreferences').children(); i < els.length; i++) {  // Loop through ranked elements
      for(let term of TERMS[els[i].dataset["category"]].slice(0, 2 * (1 + els.length - i))) { // Loop through 2*(1 + els.length - i)
        this.toAdjust["interests"]["create"].push({"key": term, "value": els.length - i});    // number of interests for each el
      }                                                                                       // Add it to the toAdjust dictionary

      // for(let vendor of VENDORS[els.data("category")]) {
      for(let j = 0; j < VENDORS[els[i].dataset["category"]].length; j++) { // Add vendor preferences - giving value - based on rank
        this.toAdjust["vendors"]["increment"].push({"key": VENDORS[els[i].dataset["category"]][j], "value": els.length - i});
      }
    }

    app.preloader.show("pink");           // Show preloader
    this.adjustPreferences();             // Add preferences to database
    setTimeout(location.reload(), 1000);  // Give time for preferences to be added, then refresh the page
  }

  addInterest() {
    let usr = this;   // Define a variable to use as a reference to the object instance in smaller scopes

    app.dialog.prompt("What topic do you want to see more articles on?", "Add an interest", function(interest) {
      if(usr.preferences['interests'][interest] == undefined || usr.preferences['interests'][interest] < 3) {
        // If the preference doesn't exist already, or is too small to be included in the settings list
        usr.preferences['interests'][interest] = 0;
        $("#interests").prepend(`
          <li class="item-content" id="adjust-` + interest + `">
            <div class="item-inner">
              <div class="item-title">` + interest + ` - <span id="` + interest + `-count">10</span></div>
              <div class="item-after">
                <div class="stepper stepper-init stepper-small stepper-raised" data-value="10" data-value-el="#` + interest + `-count">
                  <div class="stepper-button-minus" onclick="app.data.user.decrementPreference('interests', '` + interest + `')"></div>
                  <div class="stepper-button-plus" onclick="app.data.user.incrementPreference('interests', '` + interest + `')"></div>
                </div>
              </div>
            </div>
          </li>
        `);   // Add the preference to the settings list and increment its value w/ incrementPreference
        usr.incrementPreference("interests", interest, 10);
      } else {  // If the preference already exists
        app.dialog.alert("Sorry, you seem to already have an interest in this.", "Interest already exists!");
      }
    });
  }

  incrementPreference(field, key, amount = 1) {                               // Increment the user's preferences
    if(this.preferences[field][key] != undefined) {
      this.preferences[field][key] += amount               // If interest exists, increment by 1
      this.toAdjust[field]["increment"].push({"key": key, "value": amount})
    } else {                                          // Otherwise
      this.preferences[field][key] = amount                // Enter it into user.preferences and set it to 1
      this.toAdjust[field]["create"].push({"key": key, "value": amount})
    }
  }

  decrementPreference(field, key, amount = 1) {                   // Increment the user's preferences
    if(this.preferences[field][key] > amount + 1) {
      this.preferences[field][key] -= amount               // If interest exists, increment by 1
      this.toAdjust[field]["decrement"].push({"key": key, "value": amount})
    } else {                                          // Otherwise
      this.deletePreference(field, key);
    }
  }

  deletePreference(field, key) {
    delete this.preferences[field][key];
    this.toAdjust[field]["delete"].push(key);
    $("#adjust-" + key.replace(" ", "-")).fadeOut(500).remove();
  }

  getVendorPreferences() {                             // Getter method to return user's vendor preferences
    return this.preferences["vendors"];
  }

  getArticleIndex(article) {                         // Get an article from the ranked articles array
    return this.articles.indexOf(article);
  }

  getArticle(index) {
    return this.articles[index];
  }

  getAllArticles() {
    return this.articles;
  }

  blacklist(index) {
    let usr = this;   // A reference to the user object to access it in smaller scopes
    let vendor = usr.getArticle(index).getData("vendor");   // The vendor to remove
    // Make the user confirm this decision, as it is a permanent decision
    app.dialog.confirm("You won't see articles from " + vendor + " anymore.", "Are you sure?", function() {
      usr.deletePreference("vendors", vendor);    // Delete the vendor with the deletePreference method
      usr.adjustPreferences();                    // Send this adjustment to the server
      app.dialog.alert(vendor + " has been blacklisted. You won't see articles from them anymore.");
    }, function() {});    // Tell the user that the vendor has been blacklisted
  }

  adjustPreferences(index = null) {                        // Runs everytime an article is opened
    let usr = this;
    if(index != null) {
      let article = usr.getArticle(index);      // If its an article thats being incremented

      usr.incrementPreference("vendors", article["data"]["vendor"]);  // Increment the preference
                                                                      // of the article vendor
      for(let i = 0, kw = article.getKeywords(); i < kw.length; i++) {  // Loop through article keywords
        usr.incrementPreference("interests", kw[i]);                    // incrementPreference of each
      }                                                                 // keyword
    }

    if(Object.values(usr.toAdjust['interests']).flat(1).length || Object.values(usr.toAdjust['vendors']).flat(1).length) {
      $.ajax({                                          // Make a post request to the server
        type : "POST",                                  // Using the adjustpreferences API to make a change
        url : "/api/adjustpreferences/",                // to the user's preference values in the database
        data: JSON.stringify(usr.toAdjust),
        contentType: 'application/json;charset=UTF-8'   // Define that this data will be sent in JSON format
      });
      // Reset the toAdjust variable
      usr.toAdjust = {"sessionID": usr.sessionID, "interests": {"increment": [], "create": [], "decrement": [], "delete": []},
                     "vendors": {"increment": [], "decrement": [], "delete": []}};
    }

    // If the user didn't open an article to amend their interests
    if(index == null) {
      app.dialog.alert("Your interest and vendor preferences have been saved!", "Preferences updated")
    }
  }

  interestLevel(keywords) {   // Takes array of interests/news source and "interests"/"vendor" as arguments
    let prefs = this.preferences["interests"]; let keys = Object.keys(prefs);    // Gets the user's preferences dict and its keys
    return keywords.filter(x => keys.indexOf(x) >= 0).reduce((a, b) => (a + prefs[b]), 0)
    / keys.filter(x => prefs[x] > 2).reduce((a, b) => a + prefs[b], 0);   // Return the no. of articles with those interests
  }                                                                       // divided by the total number of interests

  fetchPreferences() {
    $.ajaxSetup({ async: false });
    let user = this;                                                // "this" to access object can't be used in callbacks
    $.getJSON("/api/getuserpreferences/" + this.sessionID + "/",    // Make a JSON request call to the server
    function(result) {                                              // API and simply set preferences attribute
      user.preferences = result;                                    // equal to the calls' results
    });
    $.ajaxSetup({ async: true });
  }

  loadSettings() {
    let usr = this;
    let interests = this.getInterests().filter(x=>usr.preferences["interests"][x]>2).sort();  // Sort the interests alphabetically
    let vendors = sourceSort(this.preferences['vendors']);                                    // Sort the news sources by preference
                                                                                              // using sourceSorted - used in ranking
    for(let i = 0; i < interests.length; i++) {       // Loop through each interest              process
      $('#interests').append(`
        <li class="item-content" id="adjust-` + interests[i] + `">
          <div class="item-inner">
            <div class="item-title">` + interests[i] + ` - <span id="` + interests[i] + `-count"></span></div>
            <div class="item-after">
              <div class="stepper stepper-init stepper-small stepper-raised" data-value="` + this.preferences["interests"][interests[i]] + `" data-value-el="#` + interests[i] + `-count">
                <div class="stepper-button-minus" onclick="app.data.user.decrementPreference('interests', '` + interests[i] + `')"></div>
                <div class="stepper-button-plus" onclick="app.data.user.incrementPreference('interests', '` + interests[i] + `')"></div>
              </div>
            </div>
          </div>
        </li>
      `);   // Add a "stepper" list element for each interest, allowing the user to increase and decrease its value
    }

    for(let j = 0; j < vendors.length; j++) {   // Loop through each news vendor and add a stepper list el for each vendor
      $('#vendors').append(`
        <li class="item-content" id="adjust-` + vendors[j].replace(" ", "-") + `">
          <div class="item-inner">
            <div class="item-title">` + vendors[j] + ` - <span id="` + vendors[j].replace(' ', '-') + `-count"></span></div>
            <div class="item-after">
              <div class="stepper stepper-init stepper-small stepper-raised" data-step="5" data-value="` + this.preferences["vendors"][vendors[j]] + `" data-value-el="#` + vendors[j].replace(' ', '-') + `-count">
                <div class="stepper-button-minus" onclick="app.data.user.decrementPreference('vendors', '` + vendors[j] + `',5)"></div>
                <div class="stepper-button-plus" onclick="app.data.user.incrementPreference('vendors', '` + vendors[j] + `',5)"></div>
              </div>
            </div>
          </div>
        </li>
      `)
    }
  }

  getSimilarArticles(article) {
    let similar = this.articles.filter(x => x.getKeywords().filter(y => article.getKeywords().indexOf(y) >= 0).length >= 2 && x != article);
    // Filter out the similar articles from the user's articles array
    if(similar) {     // If there are any similar articles
      for(let i = 0; i < 3; i++) {
        if(i < similar.length) {
          $('#similar-' + this.getArticleIndex(article) + '-article-' + i).html(`
              <div class="card">
                <div class="card-header">
                  <h3 class="no-padding-top"><a data-ignore-cache="true" href="/article-template7/` + this.getArticleIndex(similar[i]) +
                `/" onclick="app.preloader.show('pink')" class="no-link text-color-black">` +
                  similar[i].getData("title").replace(/[\u2018\u2019]/g, "'") + `</a></h3>
                </div>
                <div class="card-content card-content-padding"><p class="date">` + similar[i].getData("date") + `</p></div>
                <div class="card-footer">
                  <div class="row">
                    <div class="col">
                      ` + addChip(similar[i].getData("vendor")) + `
                    </div>
                  </div>
                </div>
              </div>
          `);
        } else {
          break;
        }
      }
    } else {
      $("#similar-" + this.getArticleIndex(article) + "-article-1").html(`
        <div class="card">
          <div class="card-header">
            No similar articles found...
          </div>
        </div>
      `);
    }
  }

  checkSessionID() {                                                // Validate the user by checking their username and
    let usr = this;                                                 // sessionID's were valid

    if(!getCookie("sessionID") || !getCookie("user")) {             // If either cookies are missing
      removeCookies();                                              // Hide the preloader and signout the user
      app.preloader.hide();
      app.router.navigate("/signin/", {reloadAll: true, ignoreCache: true});
      return false;                                                 // Indicate that the check has returned false
    }

    let dat = {"sessionID" : getCookie("sessionID"), "user": getCookie("user")};

    $.getJSON("/api/checksessionid/" + dat["sessionID"] + "/" + dat["user"] + "/",    // Use the server API to check
    function(result) {                                                                // the user's sessionID is the
      if(parseInt(result) != 200) {                                                   // correct one for their username
        app.preloader.hide();                                                     // If it's not then sign out the
        removeCookies();                                                              // user and hide the preloader
        app.router.navigate("/signin/", {reloadAll: true, ignoreCache: true});
      }
    });

    if(getCookie("sessionID") && getCookie("user")) {                 // Check again that the cookies are stil present
      return true;                                                    // If so, return true
    }
  }

  getWeather() {
    let usr = this;
    let date = new Date();

    if (navigator.geolocation) {                                  // If the user allows geolocation
      navigator.geolocation.getCurrentPosition(function(pos) {    // Get the current position and make an AJAX request to server
        $.getJSON("/api/getweatherinformation/" + pos.coords['latitude'] + "/" + pos.coords['longitude'] + "/",
        function(data) {    // If it's successful, for each day - populate the respective column in the HTML
          $('#weather-preloader').remove();
          for(let i = 0; i < data.length; i++) {
            $('#weather-day-' + i + '-date').text(    // Use JS Date object to calulate next 5 days of week
              ["Sun", "Mon", "Tues", "Weds", "Thurs", "Fri", "Sat"][new Date(date.getTime() + (i * 86000000)).getDay()]);
            $('#weather-day-' + i + '-icon').attr("src", "static/images/weather/" + data[i]["icon"] + ".svg");
            $('#weather-day-' + i + '-temp').text(data[i]["temperature"] + " °C")
          }
        });
      });
    } else {  // If the user does not allow geolocation - tell the user that the weather could not be fetched
      $("#weather").html("<div class='card'><div class='card-header'>Weather report could not be loaded.</div>")
    }
  }

  loadArticles(object, articles, index, amount) {         // Takes the DOM object ID, list of articles, the index of
    articles = articles.slice(index, index + amount);     // the articles to start inserting and the number of articles
                                                          // to fetch.
    articles.forEach(function(article, ind, error) {      // For each one use the addCard function to generate the card
      $("#" + object).append(addCard(article, ind));      // HTML object to append to the passed ID
    });
  }

  updateMainFeed(amount) {                              // When run will load the no. of articles passed to the main feed
    let articles = this.articles.slice(this.front, this.front + amount);    // Slice the top articles from the ranked array

    if(articles.length > 0) {                                     // If there are articles left to slice
      this.loadArticles("articles", articles, 0, amount);     // Load extra articles into the main feed
      this.front += amount + 1;                               // Increment the index at which to start fetching articles from
      return true;
    } else {
      $("#articles").append(`<div class="card"><div class="card-header">No more articles to fetch!</div></div>`);
      return false;                                           // If there are no more articles to fetch tell the user so
    }
  }

  fetchArticles() {           // Method is run after page is loaded and user is validated
    let usr = this;         // Use usr as opposed to user to avoid conflict with global instance
                            // for encapsulation purposes - "this" won't work inside of callback functions
    usr.articles = [];
    $.ajaxSetup({async: true});
    $.getJSON("/api/fetcharticledata/",                         // Fetch the RSS data from the webpage
    function( articles ) {                                      // for all the articles
      for(let i = 0; i < articles.length; i++) {                // Loop through each article fetched
        if(Object.keys(usr.preferences['vendors']).indexOf(articles[i]["data"]["vendor"]) >= 0) {
          usr.articles.push(new Article(articles[i]));            // Create an instance of the Article class,
        }                                                         // passing the article data to it.
      }

      usr.articles = articleRank(usr.articles);        // Rank all the articles fetched from the server
      usr.updateMainFeed(20);                           // Update the main feed with the top 20 ranked articles
      app.preloader.hide();   // Upon completion of appending articles to DOM, hide preloader
    });
  }
}
