'use strict';

const npsApiKey = 'SFrRDgbJqK0UmIHF3SBlVnfVqUptaERhhHhLBIzn'; 
const npsURL = 'https://developer.nps.gov/api/v1/parks';
const userAgent = '(https://mertbagt.github.io/nps-api-search/, mertbagt@gmail.com)';
const nwsURL = 'https://api.weather.gov/points/';
const alertURL = 'https://api.weather.gov/alerts/active';

var resultsArray = [];
var periodsArray = [];
var alertArray = [];
var chosenPark = 0;
var lat = 0;
var long = 0;
var forecast = '';
var alerts = '';
// var state = '';

/******************
formatting function 
******************/ 

function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
}

/****************
display functions 
****************/ 

function displayResults(responseJson) {
  resultsArray = responseJson.data;
//  console.log(resultsArray);
  $('#results-list').empty();
  let currentAddress = '';
  
  console.log('Length ' + resultsArray.length);
  if (resultsArray.length == 0) {
    $('#results-list').append(`
      <li>
        <p>No results found: try entering a state or a major city in the US</p>
      </li> 
    `)
  }

  for (let i = 0; i < resultsArray.length; i++){
    for (let j = 0; j < resultsArray[i].addresses.length; j++) {
//      console.log('Initial J value ' + j);
      if (resultsArray[i].addresses[j].type == 'Physical') {
        if (resultsArray[i].addresses[j].line2 === "") {
          currentAddress = `
            <p>
              ${resultsArray[i].addresses[j].line1}<br>
              ${resultsArray[i].addresses[j].city}&#44;&nbsp;${resultsArray[i].addresses[j].stateCode}&nbsp;${responseJson.data[i].addresses[j].postalCode}
            </p>
            <form id="result-form">
              <button type="button" id="${i}" class="btn-click-action" value="btn${i}">Test!</button>
            </form>
          `;
        } else {
        currentAddress = `
          <p>
            ${resultsArray[i].addresses[j].line1}<br>
            ${resultsArray[i].addresses[j].line2}<br>
            ${resultsArray[i].addresses[j].city}&#44;&nbsp;${resultsArray[i].addresses[j].stateCode}&nbsp;${responseJson.data[i].addresses[j].postalCode}
          </p>
          <form id="result-form">
              <button type="button" id="${i}" class="btn-click-action" value="btn${i}">Test!</button>
          </form>
        `;
//        console.log('Address check returns physical')
//        console.log(responseJson.data[i].addresses[j].line2);
//        console.log('Final J value ' + j);
        }
      } else {
        currentAddress = currentAddress;
//        console.log('Address check returns not physical')
//        console.log(responseJson.data[i].addresses[j].line2);
//        console.log('Final J value ' + j);
      }

//      console.log(responseJson.data[i].addresses[j].type);
    }
    
    

    $('#results-list').append(`
      <li>
        <a href="${resultsArray[i].url}" target="_blank">${resultsArray[i].fullName}</a>
        <p>${resultsArray[i].description}</p>
        ${currentAddress}
      </li> 
    `)
  }

  $('#results').removeClass('hidden');
}

function displayAlert(responseJson) {
  alertArray = responseJson.features  // .properties.headline/description/instruction
//  console.log('Headline: ' + alertArray.properties.headline);
  console.log(responseJson);

  $('#alert-list').empty();
  if (alertArray.length == 0) {
//    console.log('No Alerts');
    $('#alert-list').append(`
      <p>No Weather Alerts</p>
    `)
  } else { 
    for (let i = 0; i < alertArray.length; i++){
      let instruction = alertArray[i].properties.instruction
      if (instruction == null) {
        instruction = '';
      }
      
      $('#alert-list').append(`
        <p>${alertArray[i].properties.headline}</p>
        <p>${alertArray[i].properties.description}</p>
        <p>${instruction}</p>
      `)
//      console.log(responseJson.features[i].properties.headline);
    }
  } 
}

function displayForecast(responseJson) {
//  console.log(responseJson.properties.units);
  periodsArray = responseJson.properties.periods;
//  console.log(periodsArray.length);
  $('#forecast-list').empty();

  for (let i = 0; i < periodsArray.length; i++){
    $('#forecast-list').append(`
      <p>${periodsArray[i].name} ${periodsArray[i].temperature} ${periodsArray[i].temperatureUnit}</p>
      <p>${periodsArray[i].detailedForecast}</p>
      <br>
    `)    
  }
}

/*************************************
functions that interface with the apis 
*************************************/ 


function getNPS(query, maxResults) {
  const params = {
    api_key: npsApiKey,
    q: query,
    limit: maxResults
  };
  const queryString = formatQueryParams(params)
  const url = npsURL + '?' + queryString;

  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => displayResults(responseJson))
    .catch(err => {
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}

/* National Park Service latitude/longitude data needs to be translated into gridpoints before it
can be resubmited to the National Weather Service to receive the forecast */

function getNWSgridpoints(latitude, longitude) {
  var myHeaders = new Headers();
  myHeaders.append("Accept", "application/geo+json");
  myHeaders.append("User-Agent", userAgent);

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  const url = nwsURL + latitude + "%2C" + longitude;

  fetch(url, requestOptions)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => getForecast(responseJson))
    .catch(err => {
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });      
}

function getForecast(responseJson) {
  var myHeaders = new Headers();
  myHeaders.append("Accept", "application/geo+json");
  myHeaders.append("User-Agent", userAgent);

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

//  state = responseJson.properties.relativeLocation.properties.state;
  alerts = alertURL + '?point=' + lat + "%2C" + long;
  
  forecast = responseJson.properties.forecast;

  fetch(alerts, requestOptions)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => displayAlert(responseJson))
    .catch(err => {
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    }); 

  fetch(forecast, requestOptions)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => displayForecast(responseJson))
    .catch(err => {
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}


/***************************************************************
event handling functions: watching for buttons clicked/submitted 
***************************************************************/

function watchForm() {
  $('#js-form').submit(event => {
    event.preventDefault();
    const searchTerm = $('#js-search-term').val();
    const maxResults = $('#js-max-results').val();
    $('#results').removeClass('hidden');
    $('#forecast').addClass('hidden');
    $('#js-error-message').empty();
    getNPS(searchTerm, maxResults);
  });
}

function watchResults() {
  $('#results-list').on("click", ".btn-click-action", function(event) {
    chosenPark = this.id;
    lat = resultsArray[chosenPark].latitude;
    long = resultsArray[chosenPark].longitude;

    console.log('Chosen element: ' + chosenPark);
    console.log(resultsArray[chosenPark]);
    console.log('Latitude: ' + lat);
    console.log('Longitude: ' + long);
    $('#results').addClass('hidden');
    $('#forecast').removeClass('hidden');
    $('#forecast-list').empty();
    $('#alert-list').empty();
    $('#js-error-message').empty();
    getNWSgridpoints(lat, long);
  }); 
}

function watchToggle() {
  $('#forecast-toggle').on("click", ".toggle", function(event) {
    console.log('toggle button');
    $('#results').removeClass('hidden');
    $('#forecast').addClass('hidden');
  });  
}

/************
main function 
************/

function main() {
  watchForm();
  watchResults();
  watchToggle();
}

$(main);

// Display spinner/loading.gif while waiting for results?
// https://loading.io/