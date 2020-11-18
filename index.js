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
var chosenParkName = '';
var lat = 0;
var long = 0;
var forecast = '';
var alerts = '';

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
  $('#results-list').empty();
  let currentAddress = '';
  
  if (resultsArray.length == 0) {
    $('#results-list').append(`
      <li>
        <p>No results found: try entering a state or a major city in the US</p>
      </li> 
    `)
  }

  for (let i = 0; i < resultsArray.length; i++){
    for (let j = 0; j < resultsArray[i].addresses.length; j++) {
      if (resultsArray[i].addresses[j].type == 'Physical') {
        if (resultsArray[i].addresses[j].line2 === "") {
          currentAddress = `
            <p>
              ${resultsArray[i].addresses[j].line1}<br>
              ${resultsArray[i].addresses[j].city}&#44;&nbsp;${resultsArray[i].addresses[j].stateCode}&nbsp;${responseJson.data[i].addresses[j].postalCode}
            </p>
            <form id="result-form">
              <button type="button" id="${i}" class="btn-click-action button" value="btn${i}">Get Forecast</button>
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
              <button type="button" id="${i}" class="btn-click-action button" value="btn${i}">Get Forecast</button>
          </form>
        `;
        }
      }
    }
    $('#results-list').append(`
      <li class="results-li">
        <a href="${resultsArray[i].url}" target="_blank">${resultsArray[i].fullName}</a>
        <p>${resultsArray[i].description}</p>
        ${currentAddress}
      </li>
      <br>
    `)
  }

  $('#results').removeClass('hidden');
}

function displayForecastName() {
  $("h3.forecast-name").replaceWith(`
    <h3 class="forecast-name">${chosenParkName}</h3>
  `);
}

function displayAlert(responseJson) {
  alertArray = responseJson.features  // .properties.headline/description/instruction
  $('#alert-list').empty();

  if (alertArray.length == 0) {
    $('#alert-list').append(`
      <li>No Weather Alerts</li>
    `)
  } else { 
    for (let i = 0; i < alertArray.length; i++){
      let instruction = alertArray[i].properties.instruction
      
      if (instruction == null) {
        instruction = '';
      }
      
      $('#alert-list').append(`
        <li class="active-alert">
          <p>${alertArray[i].properties.headline}</p>
          <p>${alertArray[i].properties.description}</p>
          <p>${instruction}</p>
        </li>  
      `)
    }
  } 
}

function displayForecast(responseJson) {
  periodsArray = responseJson.properties.periods;
  $('#forecast-list').empty();

  for (let i = 0; i < periodsArray.length; i++){
    $('#forecast-list').append(`
      <li class="results-forecast">
        <h4>${periodsArray[i].name}: ${periodsArray[i].temperature} ${periodsArray[i].temperatureUnit}</h4>
        <p>${periodsArray[i].detailedForecast}</p>
      </li>
      <br>
    `)    
  }
}

/*************************************
functions that interface with the APIs 
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
//  myHeaders.append("User-Agent", userAgent);
//  use of header field "User-Agent" requested but not required by National Weather Service
//     -allows them to contact if your app gets blocked for security reasons
//  use of "User-Agent" causing errors on iOS phones/tablets and/or Safari browser 

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
//  myHeaders.append("User-Agent", userAgent);
//  use of header field "User-Agent" requested but not required by National Weather Service
//     -allows them to contact if your app gets blocked for security reasons
//  use of "User-Agent" causing errors on iOS phones/tablets and/or Safari browser 

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

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
    $('#forecast-list').empty();
    $('#alert-list').empty();
    $('#js-error-message').empty();

    chosenPark = this.id;
    chosenParkName = resultsArray[chosenPark].fullName;
    lat = resultsArray[chosenPark].latitude;
    long = resultsArray[chosenPark].longitude;

    displayForecastName();
    $('#results').addClass('hidden');
    $('#forecast').removeClass('hidden');
    getNWSgridpoints(lat, long);
  }); 
}

function watchToggle() {
  $('#forecast-toggle').on("click", ".toggle", function(event) {
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