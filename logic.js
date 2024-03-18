// Imports the dayjs library for handling date formats
const dayjs = require("dayjs");

async function sortLastTenDays() {

// Sets base url for fetching data
  const baseUrl =
    "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/";
  const today = dayjs();
  const promises = [];

// Loops over the last 10 days
  for (let i = 0; i < 10; i++) {
    const date = today.subtract(i, "day");
    const year = date.format("YYYY");
    const month = date.format("MM");
    const day = date.format("DD");

// Adds the date to the end of the url for each instance of the last 10 days
    const url = `${baseUrl}${year}/${month}/${day}`;
    promises.push(fetch(url).then((response) => response.json()));
  }

  try {
    const results = await Promise.all(promises);

// Stores article data
    const articlesMap = new Map();

// Populates Map with each article
    results.forEach((dayData, index) => {
      if (dayData.items && dayData.items[0] && dayData.items[0].articles) {
        dayData.items[0].articles.forEach((article) => {
          const { article: articleName, rank } = article;
          if (!articlesMap.has(articleName)) {
            articlesMap.set(articleName, {
              totalRank: rank,
              count: 1,
              daysInTop1000: 1,
            });
          } else {
            const existing = articlesMap.get(articleName);
            articlesMap.set(articleName, {
              totalRank: existing.totalRank + rank,
              count: existing.count + 1,
              daysInTop1000: existing.daysInTop1000 + 1,
            });
          }
        });
      }
    });

// Converts Map content to an array of objects and determines average rank
    const articlesArray = Array.from(
      articlesMap,
      ([articleName, { totalRank, count, daysInTop1000 }]) => ({
        article: articleName,
        averageRank: totalRank / count,
        daysInTop1000: daysInTop1000,
      })
    );

    articlesArray.sort((a, b) => {
      if (a.daysInTop1000 !== b.daysInTop1000) {

// Sorts by days in top 1000. If days are equal, sorts by average rank
        return b.daysInTop1000 - a.daysInTop1000;
      } else {
        return a.averageRank - b.averageRank;
      }
    });

// Takes the top 500 from the data   
    const top500Articles = articlesArray.slice(0, 500);
    return top500Articles;
  } catch (error) {
    console.error("Error fetching Wikipedia data:", error);
    return null;
  }
}

// Runs logic
sortLastTenDays().then((topArticles) => {
  if (topArticles) {
    console.log("Top 500 Articles Across the Last 10 Days:");

// Prints results   
    topArticles.forEach((article, index) => {

// Rounds the rank to two decimal places
      const roundedRank = article.averageRank.toFixed(2);
      console.log(
        `${index + 1}. ${
          article.article
        } - Average Rank: ${roundedRank}, Days in Top 1000: ${
          article.daysInTop1000
        }`
      );
    });
  } else {
    console.log("No data received for the last ten days.");
  }
});