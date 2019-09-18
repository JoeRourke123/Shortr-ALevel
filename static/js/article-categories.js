const VENDORS = {     // Vendors specific to certain topics to filter articles by
  "Technology": ["TechCrunch", "WIRED", "The Verge"],
  "Entertainment": ["Pitchfork", "Variety"],
  "World": ["Washington Post", "New York Times", "HuffPost"],
  "Sports": ["ESPN", "BBC Sport"],
  "UK": ["BBC News", "The Guardian", "Daily Mail"],
  "Science": ["National Geographic", "Scientific American"],
};

const TERMS = {      // Terms to filter articles by to see whether they fit into a category
  "Technology": ["ai", "computer", "blockchain", "pc", "windows", "mac", "apple", "facebook", "social", "media",
                 "hacking", "blockchain", "api", "encryption", "data", "breach", "programming", "program", "software",
                 "hardware", "cloud", "computing", "video", "games", "instagram", "processing", "google", "twitter",
                 "technology", "tech", "big", "game", "laptop", "tablet", "phone", "smartphone", "samsung", "android",
                 "ai", "system", "research", "development", "solution", "app", "security", "ios", "update", "firmware",
                 "server", "drive", "autonomous", "machine", "learning"],
  "Entertainment": ["celebrity", "music", "released", "movie", "blockbuster", "album", "actor", "actress", "tv", "film", "star",
            "hit", "celeb", "release", "tour", "musician", "band", "singer", "rapper", "song", "album", "single", "relationship",
            "release", "record", "deal", "director", "television", "media", "pop", "rock", "hip-hop", "sitcom", "drama", "lyric",
            "video", "surfaced", "rumour"],
  "World": ["emergency", "election", "international", "national", "disease", "outbreak", "crisis", "crash", "economic", "economy",
            "war", "battle", "bomb", "strike", "ban", "law", "eu", "us", "uk", "un", "virus", "humanitarian", "deficit", "threat",
            "bill", "shooting", "attack", "charged", "debt", "isis", "is", "pope", "religion", "asia", "america", "china", "airport",
            "terrorism", "terrorist", "threat", "global", "united", "nations", "states", "countries", "continents"],
  "Sports": ["score", "match", "game", "play", "set", "throw", "kick", "free", "football", "rugby", "tennis", "basketball", "hockey",
             "field", "court", "pitch", "american", "soccer", "badminton", "swimming", "olympics", "commonwealth", "games", "national",
             "skiing", "snowboarding", "netball", "women", "men", "regional", "international", "pool", "england", "team", "sport"],
  "UK": ["brexit", "prime", "minister", "school", "nhs", "government", "parliament", "mp", "election", "london", "britain",
        "theresa", "may", "corbyn", "jeremy", "eu", "european", "union", "county", "hertfordshire", "cornwall",
        "england", "scotland", "wales", "northern", "ireland", "borough", "constituency",
        "general", "college", "university", "gov", "thatcher", "queen", "royal", "family", "charles", "phillip", "harry",
        "william", "english", "british", "united", "kingdom", "great", "debate", "house", "commons", "lords", "labour", "conservative",
        "tories", "gp", "pm", "dvla", "hmrc", "gchq", "lord", "lady", "prince", "princess", "duke", "duchess", "cambridge", "police", "wedding"],
  "Science": ["research", "drug", "nasa", "spacex", "health", "science", "treatment", "found", "conclusion", "hypothesis", "tests",
              "higgs", "lab", "experiment", "data", "space", "rocket", "mission", "star", "sun", "planets", "life", "species", "developed",
              "funding", "particle", "accelerator", "ai", "health", "hospital", "breakthrough", "cancer", "virus", "bacteria", "bug", "hiv", "aids",
              "find", "rover", "mars", "moon"],
  "Politics": ["parliament", "congress", "executive", "legislature", "bill", "passed", "pass", "act", "veto", "government", "shutdown", "term",
               "office", "election", "partisan", "party", "political", "president", "prime", "minister", "house", "senate", "commons", "lords",
               "senator", "running", "2020", "brexit", "declares", "declare", "power", "confidence", "vote", "voting", "mps", "mp", "pm", "exop",
               "cabinet", "impeachment", "senator", "vice", "secretary", "shadow", "labour", "conservative", "democrats", "republicans", "head",
               "address", "downing", "street", "white", "house", "appointment", "supreme", "court", "assembly", "devolved", "contempt", "treaty",
               "eu", "nato", "paris", "agreement", "union", "state", "law", "european", "euro", "foreign", "policy", "domestic", "democratic",
               "representation", "elected", "representative", "eup", "mep", "referendum", "mandate", "popularity", "conflict"],
};

function categoryMatch(articles, category) {        // Takes a list of articles and a category to sort them in to
  let categoryArticles = [];                        // Define an empty list to store the articles that fit in the category

  for(let i = 0; i < articles.length; i++) {        // Loop through each article passed to the function
    try {                                           // Code will run successfully when looking for category
      if(VENDORS[category].indexOf(articles[i].getData("vendor")) >= 0) {     // If the article is from one of the category's
        categoryArticles.push(articles[i]);                                   // vendors
      }                                                                       // Or if it has 2 or more keywords in the TERMS dictionary
      else if(articles[i].getKeywords().filter(function(obj) { return TERMS[category].indexOf(obj) >= 0; }).length >= 2) {
        categoryArticles.push(articles[i]);                                   // push it to the categoryArticles list
      }
    }
    catch(e) {      // This code will run if not looking for a category
      if(articles[i].getKeywords().filter(function(key) { return category.split(" ").indexOf(key) >= 0 }).length >= 1) {
        categoryArticles.push(articles[i]);   // If article features passed keyword, add to categoryArticles
      } else if(articles[i].getData("vendor") == category) {    // If article is from news source passed
        categoryArticles.push(articles[i]);                     // Append to categoryArticles
      }
    }
  }

  return categoryArticles;                                                  // Return the list of articles populated in the for loop
}
