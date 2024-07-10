const axios = require("axios");

function searchSchemas({ objectIdOrName }) {

  const config = {
    method: 'post',
    url: `https://api.hubapi.com/crm-object-schemas/v3/schemas/${objectIdOrName}`,
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
    const { objectIdOrName } = context.parameters;

    const response = await searchSchemas({ objectIdOrName });
    //console.log(JSON.stringify(response.data));

    return { results: response.data.results, total: response.data.total };
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
};