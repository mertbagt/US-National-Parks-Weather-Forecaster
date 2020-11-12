'use strict';

const apiKey = 'SFrRDgbJqK0UmIHF3SBlVnfVqUptaERhhHhLBIzn'; 
const searchURL = 'https://developer.nps.gov/api/v1/parks';


function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
}

function displayResults(responseJson) {
  console.log(responseJson);
  $('#results-list').empty();
  let currentAddress = '';

  for (let i = 0; i < responseJson.data.length; i++){
    for (let j = 0; j < responseJson.data[i].addresses.length; j++) {
//      console.log('Initial J value ' + j);
      if (responseJson.data[i].addresses[j].type == 'Physical') {
        currentAddress = `
          <p>
            ${responseJson.data[i].addresses[j].line1}<br>
            ${responseJson.data[i].addresses[j].line2}<br>
            ${responseJson.data[i].addresses[j].city}&#44;&nbsp;${responseJson.data[i].addresses[j].stateCode}&nbsp;${responseJson.data[i].addresses[j].postalCode}
          </p>
        `;
//        console.log('Address check returns physical')
//        console.log(responseJson.data[i].addresses[j].line2);
//        console.log('Final J value ' + j);
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
        <a href="${responseJson.data[i].url}">${responseJson.data[i].fullName}</a>
        <p>${responseJson.data[i].description}</p>
        ${currentAddress}
      </li> 
    `)
  };

  $('#results').removeClass('hidden');
};

function getNPS(query, maxResults) {
  const params = {
    api_key: apiKey,
    q: query,
    limit: maxResults
  };
  const queryString = formatQueryParams(params)
  const url = searchURL + '?' + queryString;

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
  $('form').submit(event => {
    event.preventDefault();
    const searchTerm = $('#js-search-term').val();
    const maxResults = $('#js-max-results').val();
    getNPS(searchTerm, maxResults);
  });
}

$(watchForm);