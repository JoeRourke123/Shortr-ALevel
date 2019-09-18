function interestSort(articles) {     // Sorts a list of articles (table) by a given field
  if (articles.length < 2) {              // Function is essentially quicksort algorithm so will split array
    return articles;                      // recursively so once the length is less than 2 (just one item)
  }                                     // it cannot be sorted any further so return the array

  let pivot = articles[0];                // The value which to pivot the other values around, article 0
  let left  = [];                       // List to hold the values which are smaller than the pivot
  let right = [];                       // List to hold the values greater than the pivot

  for (let i = 1, total = articles.length; i < total; i++) {          // Loop through articles in argument array
    if (articles[i].getData("interest") < pivot.getData("interest"))    // If article at current iteration's field
      left.push(articles[i]);                                         // being observed is smaller than pivot's
    else                                                            // Append to the left list. Otherwise...
      right.push(articles[i]);                                        // Append it to the right list.
  }

  return interestSort(right).concat(pivot, interestSort(left));   // Recursively call the function
}                                                                         // until all articles sorted

function sourceSort(prefs) {                                          // Ranks the news sources by
  return Object.keys(prefs).sort(function(x, y) {                         // the number of articles the user
    return prefs[x] < prefs[y] ? -1 : prefs[x] > prefs[y] ? 1 : 0         // has read from each source using
  }).reverse();                                                           // boolean expressions and the JS
}                                                                         // sort method

function articleRank(articles) {                   // Rank articles function
  let ranked = new Array(articles.length);          // Create an array of length = no. of articles
  let sourceRanking = sourceSort(app.data.user.getVendorPreferences());  // Get the rankings of the vendors
                                                                            // passing vendorPreferences as a
                                                                           // parameter
  // rankedTables holds the all the articles ranked by interest level and RSS ranking, and the vendor ranks
  let interestRanking = interestSort(articles);   // Interest Level

  for(let i = 0; i < articles.length; i++) {    // Loop through each article
    let mean = articles[i].getData("rank");  // Interest levels and vendor prefs return NaN upon
                                                      // first use as no articles have been read, which
                                                      // throws off the functionality of the algorithm
                                                      // in which case, rank all articles by RSS ranking
    if(app.data.user.getInterests().length > 0) {  // If user has read articles
      mean = parseInt((interestRanking.indexOf(articles[i]) +
                       sourceRanking.indexOf(articles[i].getData("vendor")) +
                       articles[i].getData("rank")) / 3);
    } // Gathers the mean of the indexes articles appear in the three rankings, to get the overall rank

    if(ranked[mean] != undefined) {     // If there is already an article in that array index
      if(articles[i].getData("interest") > ranked[mean].getData("interest")) {  // If the interest level for the current
        ranked.splice(mean, 0, articles[i]);    // article is greater than the one in position "mean", then
      }                                         // insert the article at position "mean", moving the incumbent
                                                // article to index "mean" + 1
      else if(articles[i].getData("interest") < ranked[mean].getData("interest")) {   // If the article's interest
        for(let j = 0; j < ranked.slice(mean).length; j++) {      // level is smaller than that of index mean's
          if(ranked[mean + j] != undefined) {                     // find the next position where the article
            if(articles[i].getData("interest") > ranked[mean + j].getData("interest")) {  // has a higher interest level
              ranked.splice(mean + j, 0, articles[i]);                          // and insert it there
              break;                                                            // Break the loop
            }
          } else {                                    // Or, place the article in the empty index if that is
            ranked.splice(mean + j, 0, articles[i]);  // found before an article with a smaller interest level
            break;                                    // Break the inner loop
          }
        }
      } else {                                        // If the interest levels are equal
        if(articles[i].getData("rank") <= ranked[mean].getData("rank")) {  // Base the decision on which article
          ranked.splice(mean, 0, articles[i]);                          // has the higher RSS ranking
        } else {                                                        // Loop until you find an article with
          for(let j = 0; j < ranked.slice(mean).length; j++) {          // a smaller RSS ranking than that of
            if(ranked[mean + j] != undefined) {                         // the current article, and insert it
              if(articles[i].getData("rank") <= ranked[mean + j].getData("rank")) { // in that position
                ranked.splice(mean + j, 0, articles[i]);
                break;
              }
            } else {                                     // Unless an empty index is found first, in which
              ranked.splice(mean + j, 0, articles[i]);   // case insert it into that position
              break;                                     // and break the inner for loop
            }
          }
        }
      }
    }                               // However if there is no article at the index of "mean" then simply
    else {                          // insert the article into the position and move on to the next
      ranked[mean] = articles[i];   // iteration
    }
  }

  return ranked.filter(function(obj) { return obj });                    // When all the articles are ranked, return the array of ranked articles
}
