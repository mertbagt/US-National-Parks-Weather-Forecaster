'use strict';

const ParkForecaster = {
  npsApiKey: 'SFrRDgbJqK0UmIHF3SBlVnfVqUptaERhhHhLBIzn', 
  npsURL: 'https://developer.nps.gov/api/v1/parks',  
  userAgent: '(https://mertbagt.github.io/nps-api-search/, mertbagt@gmail.com)',
  nwsURL: 'https://api.weather.gov/points/',
  alertURL: 'https://api.weather.gov/alerts/active',
  resultsArray: [],
  chosenParkName: '',
  lat: 0,
  long: 0,
  currentAddress: ''
}

/******************
formatting function 
******************/ 

function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
}

function formatAddress(element, i) {
  if (element.type == 'Physical') {
    if (element.line2 === "") {
      ParkForecaster.currentAddress = `
        <p>
          ${element.line1}<br>
          ${element.city}&#44;&nbsp;${element.stateCode}&nbsp;${element.postalCode}
        </p>
        <form id="result-form">
          <button type="button" id="${i}" class="btn-click-action button" value="btn${i}">Get Forecast</button>
        </form>
      `;
    } else {
      ParkForecaster.currentAddress = `
        <p>
          ${element.line1}<br>
          ${element.line2}<br>
          ${element.city}&#44;&nbsp;${element.stateCode}&nbsp;${element.postalCode}
        </p>
        <form id="result-form">
          <button type="button" id="${i}" class="btn-click-action button" value="btn${i}">Get Forecast</button>
        </form>
      `;
    }
  }
}

function formatForecast(element) {
  $('#forecast-list').append(`
    <li class="results-forecast">
      <h4>${element.name}: ${element.temperature} ${element.temperatureUnit}</h4>
      <p>${element.detailedForecast}</p>
    </li>
    <br>
  `)
}

/****************
display functions 
****************/ 

function displayResults(responseJson) {
  ParkForecaster.resultsArray = responseJson.data;
  $('#results-list').empty();
  ParkForecaster.currentAddress = '';
  
  if (ParkForecaster.resultsArray.length == 0) {
    $('#results-list').append(`
      <li>
        <p>No results found: try entering a state or a major city in the US</p>
      </li> 
    `)
  }
    
  for (let i = 0; i < ParkForecaster.resultsArray.length; i++){
    ParkForecaster.resultsArray[i].addresses.forEach(element => formatAddress(element, i));
    $('#results-list').append(`
      <li class="results-li">
        <a href="${ParkForecaster.resultsArray[i].url}" target="_blank">${ParkForecaster.resultsArray[i].fullName}</a>
        <p>${ParkForecaster.resultsArray[i].description}</p>
        ${ParkForecaster.currentAddress}
      </li>
      <br>
    `)  
  }
  $('#results-spinner').addClass('hidden');
}

function displayAlert(responseJson) {
  let alertArray = responseJson.features  // .properties.headline/description/instruction

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
  $('#alerts-spinner').addClass('hidden');
}

function displayForecastName() {
  $('#forecast-list').append(`
      <div class="loader-group">
        <h2 class="loader-item-1">Forecast:</h2>
        <div id="forecast-spinner" class="loader-item-2">
          <div class="ld ld-hourglass ld-spin"></div>
        </div>
      </div>
      <h3>${ParkForecaster.chosenParkName}</h3>
  `);
}

function displayNull(forecastURL) {
  if (forecastURL == null) {
    $('#forecast-list').append(`
      <li class="results-forecast">
        <h4>Forecast not available for this State/Area at this time:</h4>
        <h4>Please try again later.</h4>
      </li>
      <br>
    `)
  }
}

function displayForecast(responseJson) {
  let periodsArray = responseJson.properties.periods;

  periodsArray.forEach(element => formatForecast(element));
  $('#forecast-spinner').addClass('hidden');
}

function hideSpinners(nextFunction) {
  if (nextFunction == displayResults) {
    $('#results-spinner').addClass('hidden');
  }
  if (nextFunction == displayAlert) {
    $('#alerts-spinner').addClass('hidden');
  }  
  if (nextFunction == displayForecast) {
    $('#forecast-spinner').addClass('hidden');
  } 
}

/*************************************
functions that interface with the APIs 
*************************************/ 
function fetchThings(url, options, nextFunction, endpoint) {
  fetch(url, options)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => nextFunction(responseJson))
    .catch(err => {
      alert(err.message);
      if (err.message == '') {
        $('#js-error-message').append(`Network Error.  `);
      } else {
        $('#js-error-message').append(`Something went wrong with ${endpoint}: ${err.message}.  `);        
      }
      hideSpinners(nextFunction);
    }); 
}

function getNPS(query, maxResults) {
  const params = {
    api_key: ParkForecaster.npsApiKey,
    q: query,
    limit: maxResults
  };

  const queryString = formatQueryParams(params)
  const url = ParkForecaster.npsURL + '?' + queryString;

  let requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  fetchThings(url, requestOptions, displayResults, 'Park Finder');
}

/* National Park Service latitude/longitude data needs to be translated into gridpoints before it
can be resubmited to the National Weather Service to receive the forecast */

function getNWSGridPoints() {
  let myHeaders = new Headers();
  myHeaders.append("Accept", "application/geo+json");
//  myHeaders.append("User-Agent", ParkForecaster.userAgent);
//  use of header field "User-Agent" requested but not required by National Weather Service
//     -allows them to contact if your app gets blocked for security reasons
//  use of "User-Agent" causing errors on iOS phones/tablets and/or Safari browser 

  let requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };
  
  const url = ParkForecaster.nwsURL + ParkForecaster.lat + "%2C" + ParkForecaster.long;

  fetchThings(url, requestOptions, getForecast, 'Grid Points');
}

function getForecast(responseJson) {
  let myHeaders = new Headers();
  myHeaders.append("Accept", "application/geo+json");
//  myHeaders.append("User-Agent", ParkForecaster.userAgent);
//  use of header field "User-Agent" requested but not required by National Weather Service
//     -allows them to contact if your app gets blocked for security reasons
//  use of "User-Agent" causing errors on iOS phones/tablets and/or Safari browser 

  let requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  let alertsURL = ParkForecaster.alertURL + '?point=' + ParkForecaster.lat + "%2C" + ParkForecaster.long;  
  let forecastURL = responseJson.properties.forecast;
  
  displayNull(forecastURL);

  fetchThings(alertsURL, requestOptions, displayAlert, 'Weather Alerts');
  fetchThings(forecastURL, requestOptions, displayForecast, 'Forecast');
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
    $('#results-spinner').removeClass('hidden');
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

    let chosenPark = this.id;
    ParkForecaster.chosenParkName = ParkForecaster.resultsArray[chosenPark].fullName;
    ParkForecaster.lat = ParkForecaster.resultsArray[chosenPark].latitude;
    ParkForecaster.long = ParkForecaster.resultsArray[chosenPark].longitude;
    
    displayForecastName();
    $('#results').addClass('hidden');
    $('#forecast').removeClass('hidden');
    $('#alerts-spinner').removeClass('hidden');
    getNWSGridPoints();
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