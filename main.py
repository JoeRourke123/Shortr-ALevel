# -- FOR SERVER/DATABASE --
from flask import *     # Import all methods and classes from the Flask server library
from flask_oauth import OAuth
import MySQLdb          # Import the MySQLdb library for database connection functionality
import os               # Import OS I/O functions, for getting environment variables
import json             # JSON parsing library

# -- FOR ARTICLE REQUESTS --
from urllib import quote, unquote   # Library for encoding and decoding string to concatenate to URLs
from bs4 import BeautifulSoup       # Import the libray "BeautifulSoup" for HTML parsing and extraction

# -- GOOGLE APP ENGINE INCLUDES --
from google.appengine.api import urlfetch
urlfetch.set_default_fetch_deadline(60)
from google.oauth2 import id_token
from google.auth.transport import requests
from google.appengine.api.urlfetch_errors import DeadlineExceededError


# -- FOR ENCRYPTION --
from hashlib import sha512, sha256                  # Import hashing library for hashing of user details

# -- FOR KEYWORD EXTRACTION --
from stop_words import get_stop_words               # Import stopwords library for keyword extraction
import string                                       # Import string library for extra string manipulation capabilities

# -------------------------------------------- #
# F L A S K   A N D   M Y S Q L    C O N F I G #
# -------------------------------------------- #
app = Flask(__name__)                                                   # Initialise the Flask server object
app.secret_key = "SHORTRSECRET1020"
oauth = OAuth()

# The oauth object for signing in with the Twitter API
twitter = oauth.remote_app('twitter',
    base_url='https://api.twitter.com/1/',
    request_token_url='https://api.twitter.com/oauth/request_token',
    access_token_url='https://api.twitter.com/oauth/access_token',
    authorize_url='https://api.twitter.com/oauth/authenticate',
    consumer_key='UwrSFnGa984QUL6phXmbGFqIJ',
    consumer_secret='KU7mBlsDbrfwGKIkcj0vmHtdpps4UhAe8UiinMbjBNRzip4wOF'
)

# The oauth object for signing in with the Facebook API
facebook = oauth.remote_app('facebook',
    base_url='https://graph.facebook.com/',
    request_token_url=None,
    access_token_url='/oauth/access_token',
    authorize_url='https://www.facebook.com/dialog/oauth',
    consumer_key="567848180396191",
    consumer_secret="44235a2e8d983a5bf2e7c6793a18eb97",
    request_token_params={'scope': 'email'}
)

# These environment variables are configured in app.yaml.
CLOUDSQL_CONNECTION_NAME = os.environ.get('CLOUDSQL_CONNECTION_NAME')   # Define database connection
CLOUDSQL_USER = os.environ.get('CLOUDSQL_USER')                         # constant connection details
CLOUDSQL_PASSWORD = os.environ.get('CLOUDSQL_PASSWORD')                 # fetched from environment variables
cloudsql_unix_socket = os.path.join('/cloudsql', CLOUDSQL_CONNECTION_NAME)

def connect_db():                               # Database connection function
    db = MySQLdb.connect(                       # Run the MySQLdb object's connect method
        unix_socket=cloudsql_unix_socket,       # to initalise a connection to the database
        user=CLOUDSQL_USER,                     # passing to it the socket, username, password,
        passwd=CLOUDSQL_PASSWORD,               # and specific database to access
        db="ShortrNews",
        use_unicode=True,
        charset="utf8"
    )
    return db                                   # Return the initialised and connected DB object

@app.before_request             # Runs  before every page request
def before_request():           # Function prevents "MySQL server has gone away" error
    g.db = connect_db()         # Set the global "g"'s db attribute to an instance of a DB connection

@app.teardown_request               # Runs after page request is completeted
def teardown_request(exception):    # Function prevents "MySQL server has gone away" error
    if hasattr(g, 'db'):            # Checks if the db attribute in g has been initialised
        g.db.close()                # If it has then it closes the database connection

# ---------------------------------------------- #
# C O N S T A N T S    A N D   V A R I A B L E S #
# ---------------------------------------------- #
# ---- Fetch News Vendor Data From Database ---- #
def fetchVendorData():                                  # Fetches all the vendor details from the database
    conn = connect_db()                                 # Not a page request so has to run function manually
    cursor = conn.cursor()                              # Define the DB cursor
    cursor.execute("SELECT * FROM vendorTable")         # Execute an SQL statement on the server. Select all vendors.
    vendors = cursor.fetchall()                         # Fetches all the entries returned from the query
    conn.close()                                        # Close the connection manually
    return vendors                                      # Return the vendor details fetched from the server, as an array

VENDORDATA = fetchVendorData()                              # Initialise a constant VENDORDATA holding the returned array
                                                            # from the fetchVendorData() function, run at server startup
# --- Stop Words --- #
STOPWORDS = get_stop_words("en")                            # Fetches an array of stopwords from the stopwords library

# ------------------- #
# P A G E   V I E W S #
# ------------------- #
@app.route("/")                                 # Main index page
def index():                                    # Takes no parameters
    return render_template("index.html")        # Returns the contents of the index.html file
                                                # Only route on server as all other routes handled client side for
                                                # a smoother user experience
# ----------------------- #
# A P I   R E Q U E S T S #
# ----------------------- #
# --- Article Related --- #
def returnQuery(sql):               # Takes an SQL query as an argument
    cur = g.db.cursor()             # Creates a cursor object to execute the query
    cur.execute(sql)                # Executes the query
    results = cur.fetchall()        # Store the results of the request
    cur.close()                     # Close the cursor to prevent db locking and timeouts
    return results                  # Return the fetched results

@app.route("/api/fetcharticledata/")            # API functions, run solely from the
def fetchArticleData():                         # Fetch article data, runs every time user refreshes page
    articles = returnQuery("SELECT * FROM articledataTable")    # Fetch all the article data from DB

    return json.dumps([{                                        # Format the data reading to be parsed by the client
        "data": {
            "dbID": article[0],
            "title": article[3],
            "vendor": article[2],
            "photo": article[6],
            "date": article[5],
            "url": article[4],
            "rank": article[1]
        },
        "keywords": sum(list([list(t) for t in returnQuery("SELECT keyword FROM articlekeywordTable WHERE id=" + str(article[0]))]), [])
    } for article in articles])        # Normalise the keyword data as the function will return multi dimensional tuples
                                       # and a list of single keywords is wanted.


@app.route("/api/fetcharticlecontent/<id>/")        # Takes the dbID attribute from the client as an argument
def fetchArticleContent(id):                        # Returns a single content fetched from DB with returnQuery
    return json.dumps({"content": returnQuery("SELECT content FROM articlecontentTable WHERE id=" + id)[0][0]})

# --- User Related --- #
@app.route("/api/signinuser/", methods=["POST"])                      # A request route that data can only be posted to
def signInUser():                                                     # Handles the user sign in form to validate a user
    cursor = g.db.cursor()                                            # Generate a cursor from the g.db object
    form = request.form                                               # Get the form data posted to the route

    cursor.execute("SELECT * FROM userTable WHERE username = '" + form['username'] +
                   "' AND password = '" + encryptPassword(form['password']) + "';") # Run the SQL query to check that
                                                                                    # the username and password the
                                                                                    # user entered are correct
    user = cursor.fetchone()                                # Should only be one record returned from the query

    if user:                                                # If the request returned a record, the details are correct
        resp = make_response(json.dumps({"code": 200}))     # Create a special response that initialises two cookies,
        resp.set_cookie("user", user[1]);                   # that allow the user to remain signed in and validate requests
        resp.set_cookie("sessionID", user[0])               # with the user (username) and sessionID (user's ID) cookie

        return resp                                         # Return this special response, should be a simple "200" code
    else:
        return json.dumps({"code": 400, "message": "Check your username and password are correct."}) # Return if there is
                                                            # no records matching those details in the database

@app.route("/api/signupuser/", methods=["POST"])            # Route for handling the signing up of users. Only takes POST
def signUpUser():                                           # requests, no HTTP or GET requests.
    cursor = g.db.cursor()                                  # Generate a cursor to execute queries on
    form = request.form                                     # Fetch the form data posted to the server route
    userID = generateUserID(form['username'])               # Generate a userID based on a hash of the username
    message = ""                                            # For sending an error message back to the user

    if usernameTaken(form['username']):                                                  # Check if the username is taken
        message = "Sorry, the username you wish to use is taken. Please try another."
    elif len(form['password']) < 6 or form['password'].lower() == form['password']:      # Check password is valid
        message = "Please check your password is at least 6 characters and contains at least one capital letter."

    if message:                                               # If "message" isn't empty, there's been a problem
        return json.dumps({"code": 400, "message": message})  # Return a 400 unauthorised code and the message
    else:                                                     # If there was no problem
        cursor.execute("INSERT INTO userTable (username, password, userID) VALUES ('"
                        + form['username'] + "', '" + encryptPassword(form['password']) +
                        "', '" + userID + "');")      # Insert the entered details into
        g.db.commit()                                 # the userTable in the database, committing the changes made to the db.

        for vendor in VENDORDATA:                     # For each vendor in the vendorTable
            cursor.execute("INSERT INTO vendorPreferenceTable VALUES ('" + userID + "', 0, '"  + vendor[1] + "');")
            g.db.commit()                             # Insert a record for each news source into the vendorPreferenceTable

        return json.dumps({"code": 200})                      # Return a 200 code, telling the client the action was a
                                                              # success

def socialMediaSignIn(token, source):
    userID = generateUserID(token)

    if not returnQuery("SELECT * FROM userTable WHERE username='" + token + "'"):
        cursor = g.db.cursor()      # Create an account if user doesn't already exist
        cursor.execute("INSERT INTO userTable (userID, username, password) VALUES ('" +
        userID + "', '" + token + "', '" + encryptPassword(token) + "')")
        # Execute the insertion of the user token and ID into the database
        for vendor in VENDORDATA:                     # For each vendor in the vendorTable
            cursor.execute("INSERT INTO vendorPreferenceTable VALUES ('" + userID + "', 0, '"  + vendor[1] + "');")
                                       # Insert a record for each news source into the vendorPreferenceTable
        g.db.commit()                  # Commit these changes to the database

    resp = make_response({"google": json.dumps({"code": 200}),  # Generate a differing response depending on the
                          "twitter": redirect("/"),             # API being used to sign in
                          "fb": redirect("/")}[source])         # Return 200 code for Google and redirect for FB
    resp.set_cookie("user", token)                              # and Twitter.
    resp.set_cookie("sessionID", userID)                        # Set the cookies to allow users to remain signed in
                                                                # between sessions
    return resp


@app.route("/api/googlesignin/", methods=["POST"])
def googleSignIn():
    googleID = request.form['googleID']     # Fetch the request token sent in the POST request
    try:
        # Verify the request token with Google's OAUTH2 API
        IDinfo = id_token.verify_oauth2_token(googleID, requests.Request(), "476070767063-5ll2jbo0n8odjftvfeovt26lohjh9nqd.apps.googleusercontent.com")
        # If the token could not be verified or there was an error, throw an error
        if IDinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError

        # ID token is valid. Get the user's Google Account ID from the decoded token and.
        return socialMediaSignIn(IDinfo['sub'], "google")   # create a new user account / or
                                                            # sign them in if it exists already
    except ValueError:              # If an error is thrown, return this message for the client.
        return json.dumps({"code": 400, "message": "Sorry, your account could not be authenticated."})


@twitter.tokengetter                     # Used by the OAUTH library to fetch a token
def get_twitter_token(token=None):
    return session.get('twitter_token')

@app.route("/api/authorisetwitter/")    # Authorisation route which is used to authenticate the
@twitter.authorized_handler             # Twitter request token
def authoriseTwitter(resp):
    if resp is None:
        return json.dumps({"code": 400, "message": "Sorry, your account could not be authenticated."})

    return socialMediaSignIn(resp['oauth_token'], "twitter")

@app.route("/api/twittersignin/")       # The route that gets requested by the client
def twitterSignIn():                    # Generates a request token and authorises it by redirecting
    return twitter.authorize(callback=url_for("authoriseTwitter"))  # to authorisation route


@facebook.tokengetter               # Used by OAUTH library to fetch a token
def get_fb_token(token=None):
    return session.get('fb_token')

@app.route("/api/authorisefb/")     # Callback for the "fbsignin" route, for handling authorised
@facebook.authorized_handler        # tokens.
def authoriseFB(resp):
    if resp is None:                # Returns a message if token could not be authenticated
        return json.dumps({"code": 400, "message": "Sorry, your account could not be authenticated."})
                                    # Otherwise creates an account/signs in the user
    return socialMediaSignIn(resp['access_token'], "fb")

@app.route("/api/fbsignin/")        # Requested by the client to generate a request token
def fbSignIn():                     # Allows the user to sign in with their facebook account
    return facebook.authorize(callback="https://shortr-news.appspot.com/api/authorisefb/")



@app.route("/api/checksessionid/<sessionID>/<user>/")   # For validating the user between sessions
def checkSessionID(sessionID = None, user = None):      # Checks that the username and sessionID are
    cursor = g.db.cursor()                              # valid and matching
    cursor.execute("SELECT userID FROM userTable where userID='" + sessionID + "' AND username = '" + user + "'")

    if not cursor.fetchall():                           # If there is no record where they're equal, they've been altered
        return "400"                                    # or there has been an error in the cookies, make the user signout
    else:                                               # Otherwise
        return "200"                                    # Keep the user signed in and allow them to proceed


@app.route("/api/adjustpreferences/", methods=["POST"])
def adjustPreferences():
    cursor = g.db.cursor()
    data = request.json

    if data['interests']['increment']:
        for interest in data['interests']['increment']:
            cursor.execute("UPDATE userInterestTable SET level = level + " + str(interest['value']) + " WHERE userID = '" +
            data["sessionID"] + "' AND interest = '" + interest['key'] + "';")
    if data['interests']['delete']:
        for interest in data['interests']['delete']:
            cursor.execute("DELETE FROM userInterestTable WHERE userID='" +
            data['sessionID'] + "' AND interest = '" + interest + "'")
    if data['interests']['decrement']:
        for interest in data['interests']['decrement']:
            cursor.execute("UPDATE userInterestTable SET level = level - " + str(interest['value']) + " WHERE userID = '" +
            data['sessionID'] + "' AND interest = '" + interest['key'] + "'")
    if data['interests']['create']:
        for interest in data['interests']['create']:
            try:
                cursor.execute("INSERT INTO userInterestTable (level, interest, userID) VALUES (" + str(interest['value']) + ", '" +
                interest['key'] + "', '" + data['sessionID'] + "')")
            except MySQLdb.IntegrityError:
                cursor.execute("UPDATE userInterestTable SET level = level + " + str(interest['value']) + " WHERE userID='" +
                data['sessionID'] + "' AND interest='" + interest['key'] + "'")

    if data['vendors']['increment']:
        for vendor in data['vendors']['increment']:
            cursor.execute("UPDATE vendorPreferenceTable SET level = level + " + str(vendor['value']) + " WHERE userID='" +
            data['sessionID'] + "' AND vendorName = '" + vendor["key"] + "'")
    if data['vendors']['decrement']:
        for vendor in data['vendors']['decrement']:
            cursor.execute("UPDATE vendorPreferenceTable SET level = level - " + str(vendor['value']) + " WHERE userID='" +
            data['sessionID'] + "' AND vendorName = '" + vendor["key"] + "'")
    if data['vendors']['delete']:
        for vendor in data['vendors']['delete']:
            cursor.execute("DELETE FROM vendorPreferenceTable WHERE userID = '" + data['sessionID'] +
            "' AND vendorName = '" + vendor + "'")

    g.db.commit()
    return json.dumps({"code": 200})


@app.route("/api/getuserpreferences/<sessionID>/")  # Fetch the user's preferences, ran when the user opens the website
def getUserPreferences(sessionID = None):           # Takes the user's sessionID as an argument
    return json.dumps({
        "interests": {str(interest[0]): interest[2] for interest in returnQuery("SELECT * FROM userInterestTable WHERE userID='" + sessionID + "'")},
        "vendors": {str(vendor[2]): vendor[1] for vendor in returnQuery("SELECT * FROM vendorPreferenceTable WHERE userID='" + sessionID + "'")}
    }) # Dump a dictionary connecting these dicts


@app.route("/api/getweatherinformation/<latitude>/<longitude>/")
def getWeatherInfo(latitude, longitude):        # Takes the langitude and longitude of the user as parameters in the URL
    request = urlfetch.fetch("https://api.darksky.net/forecast/eafa541b60c418809df56030ae2d3206/" + latitude + "," + longitude + "?exclude=currently,flags,minutely,hourly,alerts")
    weather = json.loads(request.content)       # Passes them to the DarkSky API and to retrieve a response
                                                # Response parsed with Python's JSON library
    return json.dumps([{                        # Generate a list of dictionaries containing simple data on the weather
        "temperature": f2c((day['temperatureMax'] + day['temperatureMin']) / 2),    # report, the mean temperature
        "icon": day['icon']                                                         # and the icon to use for it.
    } for day in weather['daily']['data'][:5]])

# ----------------- #
# F U N C T I O N S #
# ----------------- #
# --- ENCRYPTION --- #
def encryptPassword(unencrypted):                               # Pass an encrypted raw password as an argument
    return sha512(unencrypted.encode()).hexdigest()             # Hash password with a sha512 hash then return it

# --- DATABASE ACTIONS --- #
def generateUserID(username):                       # Pass the username as an argument, to generate a sessionID/userID
    return sha256(username.encode()).hexdigest()    # Return a hash generated by the sha256 hashing algorithm

def usernameTaken(username):                # Check if the username has been taken
    cursor = g.db.cursor()                  # Generate a cursor object from the database connection object
    cursor.execute("SELECT username FROM userTable WHERE username='" + username + "';") # Run the query to fetch any
                                                                                        # users with specified username
    taken = bool(len(cursor.fetchall()))    # Return boolean value generated based on whether the cursor returned any
    return taken                            # records

# --- KEYWORD EXTRACTION --- #                      # Fetch the keywords in any article given as an argument
def fetchKeywords(article):         # Split the article into words, removing punctutation, and making it lowercase
    splitArticle = article.encode("ascii", errors="ignore").lower().translate(string.maketrans("",""), string.punctuation).split(" ")
    keywords = {}                                   # Initialise a dictionary to contain the keywords

    for word in splitArticle:                       # For each word in the article
        if word not in STOPWORDS and word != "":    # If the word's not in the stopwords array, and isn't empty
            if word in keywords:                    # If the word is already in the keywords dictionary
                keywords[word] += 1                 # increment the value associated with it
            else:                                   # Otherwise
                keywords[word] = 1                  # Assign a key/value pair with the word as a key and word count of 1

    return sorted(keywords, key=keywords.get, reverse=True)[:10]    # Return top 10 frequent keywords in the article

# --- FAHRENHEIT TO CELSIUS --- #
def f2c(far):                           # Converts any given fahrenheit temperature
    return round((far - 32) / 1.8, 1)   # to celsius w/ (f - 32) / (9 / 5)

@app.route("/api/getTrending/")         # Returns a list of most frequent keywords to show the
def getTrending():                      # "trending" topics in the news
    return json.dumps(list([t[0] for t in returnQuery("""
        SELECT keyword,
            COUNT(keyword) AS occurrence
            FROM articlekeywordTable
            WHERE keyword NOT IN ('years', 'uk', 'billion', 'million', 'feel', 'ive', 'told', 'going', 'woman', 'man')
            GROUP BY keyword
            ORDER BY occurrence DESC
            LIMIT    5;
    """)])) # Use returnQuery with a complex SQL SELECT statement using COUNT, GROUP, and order
            # to generate the list of keywords; excluding certain unhelpful frequent words.

@app.route("/api/scraperss/")                           # Takes the data retrieved from the rss2json API which takes an
def getRSS():                                           # RSS url as an argument and returns the RSS feed in JSON format
    global VENDORDATA
    VENDORDATA = fetchVendorData()                                      # Refetch the vendor data to check for any new
                                                                        # sources that may have been added
    cur = g.db.cursor()                                                 # Initialise a cursor to execute queries with

    DATABASE_LAYOUT = {                                                 # Define a dictionary to lay out the structure
        "data": [7, "(id, rank, vendor, title, date, url, photo)"],     # of the different database tables
        "content": [2, "(id, content)"],
        "keyword": [2, "(id, keyword)"]
    }

    articles = {                # The data that will be put into each of the
        "data": [],             # article tables in the database
        "keyword": [],
        "content": [],
    }

    for table in DATABASE_LAYOUT:                # For each of the article data tables, delete all the previous
        cur.execute("DELETE FROM article" + table + "Table")                        # data from the last scrape
        g.db.commit()

    index = 0

    for vendor in VENDORDATA:                           # Loop through each vendor retrieved by the database
        try:
            articleRSS = urlfetch.fetch("https://api.rss2json.com/v1/api.json?rss_url=" + quote(vendor[3]) +
            "&api_key=t4udlw6dfmcyfhoueqzs9xlko2aj6auf0kyrtql9&count=20")  # Make HTTP request to the RSS feed and fetch content
            data = json.loads(articleRSS.content)                                       # Parse the data from the request as a JSON object

            for x, article in enumerate(data["items"]):     # Loop through each article in the request - add a counter with the
                try:
                    req = urlfetch.fetch(article["link"])    # Request the article with the requests library using the URL
                    parsed = BeautifulSoup(req.content, "html.parser").find("div", {"class": vendor[4].encode('utf-8')})  # Extract the content from <p> tags
                    articles["content"].append((index, " ".join([section.text for section in parsed.find_all("p")]).encode("ascii", errors="ignore")))

                    for keyword in fetchKeywords(articles["content"][index][1]):        # For each keyword in the article, add it and the article ID to
                        articles["keyword"].append((index, keyword))                    # the keywords index in the articles dictionary

                    if "image" in article:
                        image = article["image"]
                    elif "thumbnail" in article:
                        image = article["thumbnail"]
                    elif "enclosure" in article and "link" in article["enclosure"]:
                        image = article["enclosure"]["link"]
                    else:
                        image = ""

                    articles["data"].append((index, x, vendor[1], article["title"], article["pubDate"], article["link"], image))
                    # Append the data from the RSS feed for  article to the data index of the dictionary, storing the data as a tuple
                except AttributeError: # If there was an error fetching any data, skip the article
                    continue
                except DeadlineExceededError:
                    continue

                index += 1                                                          # Increment the article index (articleID) value
        except DeadlineExceededError:
            continue

    for key in articles:                                                            # Do a bulk insert for all the data fetched on the articles
        cur.executemany("INSERT INTO article" + key + "Table " + DATABASE_LAYOUT[key][1] + " VALUES (" + ", ".join(["%s" for i in range(DATABASE_LAYOUT[key][0])]) + ")", articles[key])

    g.db.commit()                                       # Commit the changes that have been made to the database

    return json.dumps({"code": 200})                    # Acknowledge the cron job has completed, will have status code 200
