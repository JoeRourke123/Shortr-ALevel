routes = [                                            // This script handles client side routing
  {                                                   // for a smoother user interface and experience
    path: '/',                                        // Route of the index page
    url: '/',                                         // Has URL of root
    on: {
      pageInit: function(e, page) {
        $(".infinite-scroll-preloader").hide();
        app.data.user = new User();      // Define the User object in global scope of app
                                                      // as an attribute of app
        if(getCookie("sessionID")) {                  // If the user instance is valid
          if(app.data.user.getInterests().length > 0) {
            $.when(page.app.data.user.fetchArticles()).done(function() {  // Load the articles and when
              console.log(page.app.data.user);                          // complete, print the user obj
            });
            app.popup.destroy("#initialPopup")
            page.app.preloader.show("pink");                 // Show the app preloader - locking the page
            getTrendingTopics();
            app.data.user.loadSettings();
            app.data.user.getWeather();
          } else {
            app.popup.open("#initialPopup", true);
          }
        }

        setTimeout(function() { $("#preloader").show() }, 3000);
      }
    }
  },
  {
    path: '/article-template7/:index/',                           // Route for article, page takes
    templateUrl: './static/pages/article-template7.html?v=2',     // the ranked index of the article
    on: {                                                         // as a parameter
      pageInit: function(e, page) {                               // On page
        let index = page.route.params["index"];
        $("#show-" + index + "-sumcontent").hide();               // Hide the full article content, and the button
        $("#article-" + index + "-content").hide();               // to show the summarised content
        let article = page.app.data.user.getArticle(index); // Get article
        console.log(page); console.log(article);

        if(!article.getData("content")) {                         // Prevents the data being fetched more than once
          article.fetchContent(article.getData("dbID"));          // Fetch the database record for the content where
          article.normalise();                                    // articleID is the index. Normalise the article
          if(!article.getData("sumcontent")) {                    // If the content has been fetched but not summarised
            let summary = page.app.data.summariser.summarise(article)
            article.setData("sumcontent", summary["summary"]);   // Summarise the article
            $("#share-" + index + "-twitter").attr("href", "http://twitter.com/share?text=" + encodeURI(summary["twitter"]) + " - https://shortr-news.appspot.com");
            $("#share-" + index + "-facebook").attr("href", "http://www.facebook.com/sharer.php?s=100&quote=" + encodeURI(summary["twitter"] + " - Summarised with Shortr.") + "&u=https://shortr-news.appspot.com")
          }
        }

        $("#article-" + index + "-keywords").prepend(addChip(article.getData("vendor")));

        for(let i = 0, j = ["sumcontent", "content", "date", "title"]; i < j.length; i++) {
          $("#article-" + index + "-" + j[i]).text(article.getData(j[i]));    // Insert data into the DOM
        }

        for(let i = 0; i < article["keywords"].slice(0, 5).length; i++) {   // Loop through top 6 keywords                                                                    // top 6 keywords
          $("#article-" + index + "-keywords").append(`
            <a class="chip color-green" href="/category/` + article["keywords"][i] + `/">
              <div class="chip-label">` + article["keywords"][i] + `</div>
            </a>
          `);   // Show the top keywords on page as in a user friendly format
        }

        page.app.data.user.getSimilarArticles(article);
      },
      pageAfterIn: function(e, page) {                                      // After the page has loaded
        if(page.direction == "forward") {
          app.preloader.hide();
          page.app.data.user.adjustPreferences(page.route.params["index"]);   // in the background, update
          console.log("Interests updated.");                                  // the user's interests -
        }
      }                                                                     // both locally and on the
    },                                                                      // database
  },
  {
    path: '/category/:category/',
    url: './static/pages/category.html?v=1',
    on: {
      pageInit: function(e, page) {
        let categorised = articleRank(categoryMatch(page.app.data.user.getAllArticles(), page.route.params["category"]));
        // Retrieve and rank the articles which meet the criteria passed in the dynamic route
        if(Object.keys(VENDORS).indexOf(page.route.params['category']) >= 0) {  // If the refinement is a category
          $("#article-category").text(page.route.params["category"] + " articles");
        } else if(Object.values(VENDORS).flat().indexOf(page.route.params["category"]) >= 0) {  // If the refinement
          $("#article-category").text("Articles from " + page.route.params["category"])         // is a news source
        }
        else {    // Otherwise the refinement must be a keyword
          $("#article-category").text("Articles about '" + page.route.params['category'] + "'");
        }

        if(categorised.length > 0) {
          // Use the User object's loadArticles method to append the articles to the page
          page.app.data.user.loadArticles("category-articles", categorised, 0, categorised.length);
        } else {
          $('#category-articles').append(`
            <div class="card">
              <div class="card-content-padding">
                <p>There were no articles found for this search term</p>
              </div>
            </div>
          `)
        }
      },
      pageAfterIn: function(e, page) {
        app.preloader.hide();   // Hide the preloader once the page has finished loading
      }
    },
  },
  {
    path: '/signin/',                                 // Sign in route, for validating user
    url: './static/pages/signin.html?v=9',
    on: {
      pageInit: function(e, page) {                  // On page initialisation
        $.getScript("https://apis.google.com/js/platform.js");
        $("#signInForm").submit(function(e) {        // Run event when signInForm submitted
          e.preventDefault();                        // Prevent it from refreshing the page
          $.ajax({                                   // Create an AJAX POST request to the
            type : "POST",                           // server's API, sending the serialised
            url : "/api/signinuser/",                // form data so it can be parsed by
            data: $('#signInForm').serialize(),      // the server
            success: function(object) {
              let parsed = JSON.parse(object);

              if(parsed["code"] == 200) {           // If the request is a success, go to news feed
                location.reload();
              } else { // Otherwise
                page.app.toast.show({                   // Display the error message returned by
                  text: parsed['message'],                // the server
                  closeTimeout: 5000,
                  destroyOnClose: true,
                });
              }
            }
          });
        });
      },
    },
  },
  {
    path: '/signup/',                                     // The sign up page for handling form
    url: './static/pages/signup.html?v=5',                // submission when user wants to create
    on: {                                                 // an account
      pageInit: function(e, page) {                       // On page initialisation
        $("#signUpForm").submit(function(e) {             // When the user submits the signUpForm
          e.preventDefault();                             // Prevent the form from submitting
                                                          // immediately and refreshing the page
          if($("#password").val() == $("#passwordConfirmation").val()) {  // If password and
                                                                          // confirmation match
            $.ajax({                        // Initialise an AJAX post request
              type : "POST",                // Send form data to the server API's signupuser
              url : "/api/signupuser/",     // route, where the database actions needed to
              data: $('#signUpForm').serialize(),   // create a user will be completed
              success: function(object) {           // Upon return from server
                let parsed = JSON.parse(object);

                if(parsed["code"] == 200) {         // If user signed up successfully
                  page.app.router.navigate("/signin/", {reloadAll: true});  // Go back to the signin page
                } else {   // Otherwise
                  page.app.toast.show({           // Generate an alert making the
                    text: parsed['message'],        // user aware of the problem that
                    closeTimeout: 5000,             // occurred
                    destroyOnClose: true,
                  });
                }
              }
            });
          } else {                                  // If the passwords aren't matching
            page.app.toast.show({                 // Prevent the request from being
              text: "Check your passwords are matching :)", // completed and let the user
              closeTimeout: 4000,                   // user know that their passwords
              destroyOnClose: true,                 // do not match.
            });
          }
        });
      },
    },
  },
  // Default route (404 page). MUST BE THE LAST
  {
    path: '(.*)',
    url: './static/pages/404.html',
  },
];
