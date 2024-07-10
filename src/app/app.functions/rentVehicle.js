const axios = require("axios");

function rentVehicle({ vehicleId,rentedBy,available,startDate,endDate }) {
  const data = JSON.stringify({
    "properties": {
        "available": available,
        "rented_by": rentedBy,
        "current_agreement_start_date":startDate,
        "current_agreement_end_date":endDate
    }
  });

  const config = {
    method: 'patch',
    url: `https://api.hubapi.com/crm/v3/objects/vehicles/${vehicleId}`,
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
    const { vehicleId,rentedBy,available,startDate,endDate} = context.parameters;
    const response = await rentVehicle({vehicleId,rentedBy,available,startDate,endDate});
    
    return { results: response.data };
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
};