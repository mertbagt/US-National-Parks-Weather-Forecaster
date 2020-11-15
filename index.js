'use strict';

const npsApiKey = 'SFrRDgbJqK0UmIHF3SBlVnfVqUptaERhhHhLBIzn'; 
const npsURL = 'https://developer.nps.gov/api/v1/parks';
var resultsArray = [];
var chosenPark = 0;
var lat = 0;
var long = 0; 

function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
}

function displayResults(responseJson) {
  resultsArray = responseJson.data;
//  console.log(resultsArray);
  $('#results-list').empty();
  let currentAddress = '';

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
  };

  $('#results').removeClass('hidden');
};

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
//    .then(responseJson => console.log(JSON.stringify(responseJson)))
    .then(responseJson => displayResults(responseJson))
    .catch(err => {
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}

function watchForm() {
  $('#js-form').submit(event => {
    event.preventDefault();
    const searchTerm = $('#js-search-term').val();
    const maxResults = $('#js-max-results').val();
    $('#results').removeClass('hidden');
    $('#forecast').addClass('hidden');
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
  }); 
}

function watchToggle() {
  $('#forecast-toggle').on("click", ".toggle", function(event) {
  console.log('toggle button');
  $('#results').removeClass('hidden');
  $('#forecast').addClass('hidden');
  });  
}

function main() {
  watchForm();
  watchResults();
  watchToggle();
}

$(main);

// Display spinner/loading.gif while waiting for results?
// https://loading.io/