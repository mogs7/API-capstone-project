import express, { query } from "express";
import axios from "axios";
import bodyParser from "body-parser";
import querystring from "querystring";
import { readFileSync, appendFileSync, writeFileSync  } from "fs";

const app = express();
const port = 3000;

// Read contents of file and store its values into a map
var importCredentials = readFileSync('credentials.txt','utf-8');
var splitToLines = importCredentials.split('\n');
var credentialsMap = {};
for (let i=0;i<splitToLines.length;i++){
    const [key, value] = splitToLines[i].split(':').map(trimEnd => trimEnd.trim());
    credentialsMap[key] = value;
}
// console.log(credentialsMap);

var client_id = credentialsMap.ClientID;
var client_secret = credentialsMap.ClientSecret;
var redirect_uri = 'http://localhost:3000/token';

var bearerToken = credentialsMap.BearerToken;

// console.log({
//     client_id,
//     client_secret,
//     bearerToken
// })

const data = querystring.stringify({'grant_type':'client_credentials'});

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

app.get('/', (req,res) => {
    res.render('login.ejs');
})

app.get('/login', (req,res) => {
    try {
        res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        redirect_uri: redirect_uri,
        }));
    } catch (error) {
        console.log(error.message)
    }
})

app.get('/token', async (req,res) => {
    // console.log(JSON.stringify(req.query));
    // console.log(JSON.stringify(req.body));
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token/', data,{
            headers: {
                'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
        });
        let writeTokenToFile = response.data.access_token;
        // console.log(writeTokenToFile);
        let writePath = "C:/Users/MIGUEL MOLINA/Desktop/Programming Files/Dr. Angela Yu's Web Dev Course Files/APIs/Capstone Project/credentials.txt";
        splitToLines[0] = "BearerToken:"+writeTokenToFile;
        // console.log(splitToLines);
        
        // Update credentials.txt
        writeFileSync(writePath, splitToLines.join('\n'));
        
        res.render('index.ejs', {data: "Logged in and Bearer Token updated!: " + bearerToken}) 
    } catch (error) {
        console.log(error);
    }
})

app.post('/search', async (req,res) => {
    console.log(req.body);
    let searchVal = req.body.searchLimit;
    if (searchVal == ''){
        searchVal = 18;
    }
    try {
        const response = await axios.get('https://api.spotify.com/v1/search?' +
        querystring.stringify({
            q: req.body.searchItem,
            type: req.body.searchType,
            limit: searchVal,
        })
        ,{
            headers: {
                'Authorization':'Bearer '+ bearerToken,
            }
        });
        if (req.body.searchType == "track"){
            res.render('index.ejs', {
                data: trackData(response),
            })
        } else if (req.body.searchType == "album"){
            res.render('index.ejs', {
                data: albumData(response),
            })
        } else if (req.body.searchType == "artist"){
            console.log(artistData(response));
            res.render('index.ejs', {
                data: artistData(response),
            })
        }  
    } catch (error) {
        console.log("An error occured: " + error);
        console.error("Error: " + error.message);
    }
})

app.listen(port, ()=>{
    console.log("Server running on port: " + port);
})


function trackData(response){
    var songInfo = [];
        for (let i=0;i<response.data.tracks.items.length;i++){
            let convertToSeconds = response.data.tracks.items[i].duration_ms/1000;
            let songMinutes = Math.floor(convertToSeconds/60);
            let songSeconds = String(Math.floor(convertToSeconds % 60)).padStart(2,'0');
            // console.log("Min: " + songMinutes + " | Sec: "+ songSeconds);
            var artistNameArray = [];
            for (let j=0; j<response.data.tracks.items[i].artists.length;j++){
                artistNameArray.push(response.data.tracks.items[i].artists[j].name);
            } 
            songInfo[i] = {
                searchType: "song",
                songName: response.data.tracks.items[i].name,
                albumName: response.data.tracks.items[i].album.name,
                artistName: artistNameArray,
                songRunTime: songMinutes + ":" + songSeconds,
                songCover: response.data.tracks.items[i].album.images[0].url,
            }
        }  
        return songInfo;
}

function albumData(response){
    var albumInfo = [];
        for (let i=0;i<response.data.albums.items.length;i++){
            var artistNameArray = [];
            for (let j=0; j<response.data.albums.items[i].artists.length;j++){
                artistNameArray.push(response.data.albums.items[i].artists[j].name);
            } 
            let albumTypeString = response.data.albums.items[i].album_type;
            albumInfo[i] = {
                searchType: "album",
                albumName: response.data.albums.items[i].name,
                artistName: artistNameArray,
                albumType: albumTypeString.charAt(0).toUpperCase() + albumTypeString.slice(1),
                albumYear: String(response.data.albums.items[i].release_date).substring(0,4),
                albumCover: response.data.albums.items[i].images[0].url,
            }
        }  
        return albumInfo;
}

function artistData(response){
    var artistInfo = [];
        for (let i=0;i<response.data.artists.items.length;i++){
            var artistGenreArray = [];
            for (let j=0; j<response.data.artists.items[i].genres.length;j++){
                let genreStringCapitalize = response.data.artists.items[i].genres[j];
                // console.log(genreStringCapitalize);
                let genreStringFormat = " "+genreStringCapitalize.charAt(0).toUpperCase() + genreStringCapitalize.slice(1);
                artistGenreArray.push(genreStringFormat);
            } 
            
            let imageObject = response.data.artists.items[i].images[0];
            let hasPicture = imageObject?.url || "https://cdn.pixabay.com/photo/2015/11/03/08/56/question-mark-1019820_960_720.jpg";

            artistInfo[i] = {
                searchType: "artist",
                artistName: response.data.artists.items[i].name,
                artistGenre: artistGenreArray,
                artistFollowers: (response.data.artists.items[i].followers.total).toLocaleString() + " followers",
                artistPicture: hasPicture,
            }
        }  
        return artistInfo;
}
