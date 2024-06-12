import express from "express"
import bodyParser from "body-parser"
import  axios  from "axios"
import fs from "fs";

const app = express();
const port = 3000;
const ApiLink = `http://api.aladhan.com/v1/timingsByCity?`
const ApiTime = "http://api.weatherapi.com/v1/current.json?key=f6ad33224f814bc0b3a81043242005&aqi=no&";
var countries = [];
var cities = [];
var dataJson = JSON.parse(fs.readFileSync("data.json"))
for (let i = 0; i < dataJson.data.length; i++) {
    countries.push(dataJson.data[i].country);    
}
var coun, cit,currentdate;
var testDates = [];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req,res) => {
    res.render("index.ejs", {country : countries})
});


app.post("/country", (req,res) => {
    coun = req.body.select; // Country Name value
    const temp = dataJson.data.filter(a => a.country === coun) //Filter and return country selected's cities
    cities = temp[0].cities // List of cities 
    res.render("index.ejs", {country : countries, city : cities})
})


app.post("/prayer", async (req,res) => {
    cit = req.body.selectCity; // City Name value
    try {
        const response = await axios.get(ApiLink +`city=${cit}&country=${coun}`); //Fetch prayer times
        const result = response.data ;
        const response_time = await axios.get(ApiTime + `q=${cit}`); // Fetch local time of the chosen city 
        const result_time = response_time.data.location.localtime; // Current time of the chosen city in string format
        currentdate = timeSpliting(result_time); // Current time of the chosen city in date format
        testDates = []; // redeclare the arr
        // Converting and pushing elements into the testDates list
        prayerList(`${result_time.split(" ")[0]}`+ ` ${result.data.timings.Fajr}`);
        prayerList(`${result_time.split(" ")[0]}`+ ` ${result.data.timings.Dhuhr}`); 
        prayerList(`${result_time.split(" ")[0]}`+ ` ${result.data.timings.Asr}`); 
        prayerList(`${result_time.split(" ")[0]}`+ ` ${result.data.timings.Maghrib}`); 
        prayerList(`${result_time.split(" ")[0]}`+ ` ${result.data.timings.Isha}`);
        var diff = new Date(getNextClosestDate(testDates,currentdate)); // Get the next closest prayer time
        diff = new Date(diff-currentdate); // Difference between current time and the closest prayer timea
        diff.setHours((diff.getHours())); // {Substracting 3 hours}
        res.render("index.ejs", {country : countries, city : cities, data : result.data, passedCity : cit, passedCoun : coun, cureentTime : result_time, timeRem: diff})
    } catch (error) {
        res.render("index.ejs", {error: error.message});
    }
})

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});


// Converting String to date
function timeSpliting(para) {
    var tempo = para.split(" ");
    var date = tempo[0].split("-");
    var time = tempo[1].split(":");
    return  new Date(parseInt(date[0]), parseInt(date[1]-1) , parseInt(date[2]) , parseInt(time[0]) ,parseInt(time[1]));
}

// Find the next closest date to the current date
function getNextClosestDate(dates, currentDate) {
      
    const current = new Date(currentDate);
    let closestDate = null;
    let minDiff = Infinity;
  
    dates.forEach(dateString => {
      const date = new Date(dateString);
      const diff = date - current;
  
      if (diff > 0 && diff < minDiff) {
        closestDate = date;
        minDiff = diff;
      }
    });
  
    return closestDate ? closestDate.toISOString() : null;
}

// Pushing the prayers time to a list
function prayerList(para) {
    var tempo = para.split(" ");
    var date = tempo[0].split("-");
    var time = tempo[1].split(":");
    testDates.push( new Date(parseInt(date[0]), parseInt(date[1]-1) , parseInt(date[2]) , parseInt(time[0]) ,parseInt(time[1])));
}
