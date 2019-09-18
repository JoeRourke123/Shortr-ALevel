// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  id: 'com.appspot.shortr-news', // App bundle ID
  name: 'Shortr', // App name
  theme: 'md', // Automatic theme detection
  input: {
    scrollIntoViewOnFocus: true,
    scrollIntoViewCentered: true,
  },
  // App root data
  data: function () {
    return {
      summariser: new Summariser(),
    };
  },
  // App routes
  routes: routes,
});

// Init/Create main view
var mainView = app.views.create('.view-main', {
  url: '/',
  stackPages: true,
  allowDuplicateUrls: true,
});

let loading = false;
$('.infinite-scroll-content').on('infinite', function (page) {
  // Exit, if loading in progress
  if (loading) return;

  // Set loading flag
  loading = true;

  // Emulate 1s loading
  setTimeout(function () {
    // Reset loading flag
    loading = false;

    if (!app.data.user.updateMainFeed(20)) {
      $('#preloader').hide();
      // Nothing more to load, detach infinite scroll events to prevent unnecessary loadings
      $("#tab2").removeClass("infinite-scroll-content");
      return;
    };
  }, 1500);
});

$('#refresh').click(function() {    // Upon the clicking of the refresh button
  app.preloader.show("pink");       // Show the app preloader again
  app.data.user.fetchArticles();    // Rerun the fetchArticles method
});

$('#search').click(function() {    // Upon the clicking of the search button
  app.dialog.prompt("What would you like to search for?", "Search", function(term) {
    if(term) {
      app.router.navigate("/category/" + term.toLowerCase() + "/");   // Open the category
    }
  });   // page and pass the results of the search
});
