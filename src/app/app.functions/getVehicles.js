const axios = require("axios");

function searchVehicles({ available }) {
  const data = JSON.stringify({
    sorts: [],
    properties: ["hs_object_id","available","vin","make","model","year","rented_by"],
    limit: 100,
    after: 0,
    "filterGroups":[
      {
        "filters":[
          {
           "propertyName":"available",
           "operator":"EQ",
           "value": available
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
    const { available } = context.parameters;

    const response = await searchVehicles({ available });

    return { results: response.data.results, total: response.data.total };
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
};