import express, { query } from "express";
import axios from "axios";
import bodyParser from "body-parser";
import querystring from "querystring";
import { runInThisContext } from "vm";

const app = express();
const port = 3000;

var client_id = '5876b387b5374cb5b6c69a1acacab167';
var client_secret = 'e0961ef2c2da441eade62da54520b250';
var redirect_uri = 'http://localhost:3000/token';

var grant_type = "authorization_code";
var code = "AQBlW6iGENs8DY-wmQmbqZfNENbS7u4X1CYRNo3K1z0r02FRx3_FLC_WQKKI-K6M-pLYvZHF0o5qEe-BpRmQgaqnCc_iOA1_o7c6A23TgarTHj5Uuh7-ZQKZR-XWOFyBZi4TVGNCrVe1o6AvNyABDYH5wq74EvAAfw";
var bearerToken = "BQBeKP1hF4CzHd2VB_bGb0Htb5f7dhdO8dj11Pz_bp0X2Lc5XOe1vTWdZyk1dBlWMmux5DHz5JVIDpspEk74QojcAsraz311WyY30M--q6Tw4Psf2II";

const data = querystring.stringify({'grant_type':'client_credentials'});

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

app.get('/', (req,res) => {
    res.render('index.ejs');
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
        console.log(error)
    }
})

app.get('/token', async (req,res) => {
    console.log(JSON.stringify(req.query));
    console.log(JSON.stringify(req.body));
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token/', data,{
            headers: {
                'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
        });
        bearerToken = response.data.access_token;
        res.render('index.ejs', {data: "Logged in and Bearer Token updated!: " + bearerToken}) 
        //console.log(response);
    } catch (error) {
        console.log(error);
    }
})

app.post('/showBearer', (req,res) =>{
    console.log("BearToken: " + bearerToken);
    res.render('index.ejs',{
        bearToken: bearerToken,
    })
})

app.post('/search', async (req,res) => {
    // console.log(req.body.songQuery);
    // console.log(req.body);
    //console.log(bearerToken);
    try {
        const response = await axios.get('https://api.spotify.com/v1/search?' +
        querystring.stringify({
            q: req.body.songQuery,
            type: req.body.searchType,
            limit: req.body.searchLimit,
        })
        ,{
            headers: {
                'Authorization':'Bearer '+ bearerToken,
            }
        });
        // console.log(JSON.stringify(response.data));

        // This block of code creates an array of objects to send to the EJS
        var searchedSongs = [];
        for (let i=0;i<response.data.tracks.items.length;i++){
            let convertToSeconds = response.data.tracks.items[i].duration_ms/1000;
            let songMinutes = Math.floor(convertToSeconds/60);
            let songSeconds = String(Math.floor(convertToSeconds % 60)).padStart(2,'0');
            console.log("Min: " + songMinutes + " | Sec: "+ songSeconds);
            var artistNameArray = [];
            for (let j=0; j<response.data.tracks.items[i].artists.length;j++){
                artistNameArray.push(response.data.tracks.items[i].artists[j].name);
            } 
            searchedSongs[i] = {
                songName: response.data.tracks.items[i].name,
                albumName: response.data.tracks.items[i].album.name,
                artistName: artistNameArray,
                songRunTime: songMinutes + ":" + songSeconds,
                songCover: response.data.tracks.items[i].album.images[0].url,
            }
        }   
        // console.log(JSON.stringify(searchedSongs));
        res.render('index.ejs', {
            data: searchedSongs,
        })
    } catch (error) {
        console.log("An error occured: " + error);
        console.error("Error: " + error.message);
    }
})

app.listen(port, ()=>{
    console.log("Server running on port: " + port);
})


// for (let i=0;i<response.data.tracks.items.length;i++){
//     console.log(artistNameArray);
//     songNameArray[i] = response.data.tracks.items[i].name;
//     albumNameArray[i] = response.data.tracks.items[i].album.name;
//     for (let j=0; j<response.data.tracks.items[i].artists.length;j++){
//         //console.log("i index: "+ i + " | j index: "+ j);
//         //console.log(response.data.tracks.items[i].artists.length);
//         artistNameArray[j] = response.data.tracks.items[i].artists[j].name;
//     }
//     let convertToSeconds = response.data.tracks.items[i].duration_ms/1000;
//     let songMinutes = Math.floor(convertToSeconds/60);
//     let songSeconds = convertToSeconds % 60;
//     songRunTimeArray[i] = songMinutes + songSeconds;
// }
        // songName:songNameArray,
        // albumName:albumNameArray,
        // artistName:artistNameArray,
        // songRunTime:songRunTimeArray,

        // console.log("Song name array Length: " + songNameArray.length);
        // console.log("Album name array Length: " + albumNameArray.length);
        // console.log("Artist name array Length: " + artistNameArray.length);
        // console.log("Run Time array Length: " + songRunTimeArray.length);




// <% if (locals.data) { %>
//     <% for(let i=0;i<data.length;i++) { %>
//         <ul class="w-1/4 h-1/4 bg-slate-600 mb-8 p-4 box-border">
//             <li>Song Name: <%=data[i].songName%></li>
//             <li>Album Name: <%=data[i].albumName%></li>
//             <li>Artists Name: <%=data[i].artistName%></li>
//             <li>Song Run Time: <%=data[i].songRunTime%></li>
//         </ul>
//     <% } %>
// <% } %>

{/* <h1>Test card</h1>
<div class="flex w-screen justify-center">
    <img src="https://i.scdn.co/image/ab67616d0000b2731f44db452a68e229650a302c" alt="">
    <div class="song-details-div">
        <h2>Escapism</h2>
        <h3>Escapsim</h3>
        <h3>TEMPLIME, some Japanese artist</h3>
        <h4>4:21</h4>
    </div>
</div> */}
