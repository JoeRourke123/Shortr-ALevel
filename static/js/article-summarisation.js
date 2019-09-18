class Summariser {
  constructor() {
    this.cutoff = 0.0001;           // The cutoff level for the recursion of the TextRank method
    this.damp = 0.85                // The dampening factor of the TextRank algorithm
  }

  measureSimilarity(x, y) {         // Takes two sentences (x and y) as parameters, measures their similarity
    let words = Array.from(new Set(x.words().concat(y.words())));    // Create a set of all unique words in the two sents
    let vectors = [new Vector(words.length, 0), new Vector(words.length, 0)]; // Two empty vectors used to hold the
                                                                          // no. of word occurences in each sentence

    for(let i = 0; i < 2; i++) {                            // Loop through each vector
      let current = [x, y][i].words();                      // Select the words from the current sentence

      for(let j = 0; j < current.length; j++) {             // Loop through each word in the sentence
        vectors[i].increment(words.indexOf(current[j]));      // Increment the vector at the index the word appears in
      }                                                     // the words set
    }

    let similarity = (vectors[0].dotProd(vectors[1]) / (vectors[0].magnitude() * vectors[1].magnitude()));
                                        // Calculate the cosine similarity between the
                                        // two vectors by doing (x dot product y) / (magnitude of x) * (magnitude of y)
    return similarity;                  // Return the similarity
  }

  similarityMatrix(sentences) {                      // Takes all the sentences in the article as an argument
    let matrix = new Matrix(sentences.length, 0);    // Create a matrix of size (no. of sentences) x (no. of sentences)

    for(let i = 0; i < sentences.length; i++) {      // Loop through each row in the matrix
      let row = [];

      for(let j = 0; j < sentences.length; j++) {   // Loop through each element in the matrix
        if(i != j) {                       // Don't compare a sentence against itself as it will result in 1.0
          row.push(this.measureSimilarity(sentences[i], sentences[j])); // Find the value of the similarity between
        } else {                                                        // sentence i and sentence j, append to row list
          row.push(0);                                                  // If i and j are equal, push 0 to row instead
        }
      }
      matrix.setRow(i, row);      // Use the matrix's setRow method to append the populated row to the matrix
    }

    return matrix;                // Return the populated similarity matrix
  }

  textRank(matrix, textRank = undefined) {                          // The recursively run TextRank algorithm, an adaptation
    let self = this;                                                // of Google's textRank. Used here to rank the sentences
                                                                    // in the news article
    if(textRank == undefined) {                                     // Upon the first run of the algorithm
      textRank = new Vector(matrix.len(), (1 / matrix.len()));    // Create new vector with all values (1 / matrix length)
    }

    let newTextRank = new Vector(matrix.len(), 0);                 // Initialise vector for recalculated, converging TextRank
                                                                   // score
    for(let i = 0; i < newTextRank.len(); i++) {                   // Loop through each item in the Vector/sentence in article
      let rankCalc = (1 - self.damp) + self.damp * (matrix.val()[i].reduce((a, b, x) => a + ((b * textRank.val()[x]) /
                                                                                                  newTextRank.len()), 0));
      newTextRank.assign(i, rankCalc);                            // Calculate the new TextRank value for that sentence and assign
    }                                                             // it to it's corresponding index in the vector

    if(Math.abs(textRank.val().reduce((a,b) => a + b, 0) - newTextRank.val().reduce((a,b) => a + b, 0)) <= self.cutoff) {
      return newTextRank;                           // If the sum of the old TR scores - sum of new TR scores is less than the
    }                                               // cutoff constant then return the new TR scores

    return this.textRank(matrix, newTextRank);      // Otherwise recursively run the function again, passing the new TR scores
  }

  summarise(article) {      // Take the sentences from the article as a parameter
    let matrix = this.similarityMatrix(article.sents());
    let ranking = this.textRank(matrix);  // The returned newTextRank vector from the textRank algorithm
    let rankingValues = ranking.val();    // The values of the ranking

    let indices = new Array(rankingValues.length);                  // Initialise an array to hold the indexes of the ranked
    for (var i = 0; i < rankingValues.length; ++i) indices[i] = i;  // sentences. Assign each value to its respective index
    indices.sort(function (a, b) {                                  // Sort the array of indexes by the ranking of the sentences
       return rankingValues[a] < rankingValues[b] ? -1 : rankingValues[a] > rankingValues[b] ? 1 : 0;   // With a comparative
     }).reverse();                                                                                      // sort algorithm using
                                                                              // inline boolean selection statements
    let summarised = "";
    let tweet = "";

    for(let i = 0; i < article.len(); i++) {                                  // Generate a shorter summary to be shared on
      if(tweet.length <= 250) {                                               // social media
        tweet = tweet.concat(article.sents()[indices[i]].full);               // Concatenate to the tweet variable
      }
      if(summarised.length < 300) {
        summarised = summarised.concat(article.sents()[indices[i]].full + " ");  // Concatenate the top ranked articles to
      }                                                                       // the summarised string, until the article
      else {                                                                  // reaches 300 characters, then stop
        break;                                                                // concatenating the string and break the loop
      }
    }

    return {
      "summary": summarised,                                  // Return a JSON object containing the regular summary,
      "twitter": tweet                                        // as well as the further summarised version for Twitter
    };                                                        // and Facebook
  }
}
