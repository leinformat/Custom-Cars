const axios = require("axios");

function searchVehicles({ contactId }) {
  const data = JSON.stringify({
    sorts: [],
    properties: ["hs_object_id","available","vin","make","model","year","current_agreement_end_date","current_agreement_start_date","rented_by"],
    limit: 100,
    after: 0,
    "filterGroups":[
      {
        "filters":[
          {
           "propertyName":"rented_by",
           "operator":"EQ",
           "value": contactId
        }
        ]
      }
    ],
  });
  const config = {
    method: 'post',
    url: 'https://api.hubapi.com/crm/v3/objects/vehicles/search',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env['PRIVATE_APP_ACCESS_TOKEN'],
    },
    data: data
  };
  return axios.request(config);
}

exports.main = async (context) => {
  try {
    /*
    const url = 'https://api.hubapi.com/collector/graphql'

    const bodyRequest = {
      "operationName": "vehicles",
      "query": "query vehicles ($contactID: String) { CRM       {p_vehicles_collection(filter: {rented_by__eq: $contactID}) { items {                asking_price bedrooms bathrooms city}}}}",
      "variables": {
        "contactID": "1103",
        "otra" : '123'
      }
    }
    */
    const { contactId } = context.parameters;
    const response = await searchVehicles({ contactId });
    return { results: response.data.results, total: response.data.total };
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
};