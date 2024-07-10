import {
  Button,
  DateInput,
  Flex,
  LoadingSpinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Modal,
  ModalBody,
  hubspot,
  Form,
  StatusTag
} from "@hubspot/ui-extensions";
import React, { useEffect, useState } from "react";

const ITEMS_PER_PAGE = 5;

// Define the extension to be run within the Hubspot CRM
hubspot.extend(({ context, runServerlessFunction, actions }) => (
    <RentCars
      context={context}
      runServerless={runServerlessFunction}
      sendAlert={actions.addAlert}
      fetchProperties={actions.fetchCrmObjectProperties}
      actions={actions}
    />
));

const RentCars = ({ context, runServerless, sendAlert,fetchProperties,actions }) => {
  const [vehicles, setVehicles] = useState([]);

  const [currentPage, setCurrentPage] = useState(1); // For controlling current page
  const [numPages, setNumPages] = useState(0); // For storing the total number of pages

  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [vehiclesFetching, setVehiclesFetching] = useState(false); 

  // Function to change the current page
  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  // Whenever the locationCount or locations change, reset the paging
  useEffect(() => {
    setNumPages(Math.ceil(vehiclesCount / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [vehiclesCount, vehicles]);

  // Calculate the slice of locations for the current page
  const vehiclesOnCurrentPage = vehicles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Get Availables Vehicles
  function fetchVehicles() {
    setVehiclesFetching(true);
    runServerless({
      name: "getVehicles",
      parameters: { available: "Yes" },
    }).then((dataVehicles) => {

      const filterVehicles= dataVehicles.response.results.filter((item) => item.properties.available != 'no' );
      setVehicles(filterVehicles);
      setVehiclesCount(100);
      setVehiclesFetching(false);
    })
  }

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Rent Form
  const [formValues, setFormValues] = useState({startDate: null, endDate:null });
  const handlerFormChange = (e,name) =>{
    setFormValues(state =>({
        ...state,
        [name]: e
    }))
  }

//Converts a date string to a Unix timestamp in seconds.
function convertToUnixTimestamp(dateString) {
  // Create a Date object from the date string
  const date = new Date(dateString);
  // Get the Unix timestamp in milliseconds since Jan 1, 1970, 00:00:00 UTC
  const unixTimestampMilliseconds = date.getTime();
  // Convert the Unix timestamp from milliseconds to seconds
  const unixTimestampSeconds = Math.floor(unixTimestampMilliseconds / 1000);
  // Return the Unix timestamp in seconds
  return unixTimestampSeconds;
}

 // Rent Vehicle
 const handlerFormSubmit = (e,vehicleId) => {
    const { targetValue } = e;
    const unixStartDate = convertToUnixTimestamp(targetValue.startDate);
    const unixEndDate = convertToUnixTimestamp(targetValue.endDate);

    if(!unixStartDate || !unixEndDate){
      sendAlert({ message: "All inputs are required", type: "warning" });
      return;
    }else if(unixStartDate > unixEndDate){
      sendAlert({ message: "The Start Date cannot be greater than the End Date :(", type: "warning" });
      return;
    }else{
      sendAlert({ message: "Submitted successfully :)", type: "info" });
    }

    const parameters = {
      startDate: targetValue.startDate,
      endDate: targetValue.endDate,
      vehicleId,
      rentedBy: context.crm.objectId,
      available: "no",
    };
    
    runServerless({
      name: "rentVehicle",
      parameters,
    }).then((response) => {
        actions.refreshObjectProperties();
        actions.closeOverlay('rent-vehicle-modal');
        fetchVehicles();
    });
  };

  return (
    <>
      <Flex direction="column" gap="medium">
        {vehiclesFetching && (
          <LoadingSpinner label="Loading..." layout="centered" />
        )}
        <Flex direction={"row"} justify={"end"} wrap={"wrap"} gap={"small"}>
          <Button
            onClick={() => {
              fetchVehicles();
            }}
            variant="destructive"
            size="xs"
            type="button"
          >
            Refresh Table
          </Button>
        </Flex>
        <Table
          bordered={true}
          paginated={true}
          pageCount={numPages}
          onPageChange={(newPage) => changePage(newPage)}
        >
          <TableHead>
            <TableRow>
              <TableHeader>MAKE</TableHeader>
              <TableHeader>MODEL</TableHeader>
              <TableHeader>YEAR</TableHeader>
              <TableHeader>ACTION</TableHeader>
              <TableHeader>STATUS</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehiclesOnCurrentPage.map((vehicle) => (
              <TableRow>
                <TableCell>{vehicle.properties.make}</TableCell>
                <TableCell>{vehicle.properties.model}</TableCell>
                <TableCell>{vehicle.properties.year}</TableCell>
                {/* Rent Car */}
                <TableCell>
                  <Button
                    variant="primary"
                    overlay={
                      <Modal
                        id="rent-vehicle-modal"
                        title="Rent Information"
                        width="sm"
                      >
                        <ModalBody>
                          <Form
                            onSubmit={(e) => {
                              handlerFormSubmit(e, vehicle.id);
                            }}
                          >
                            <Flex direction="column" gap="small">
                              <DateInput
                                label="Start Date"
                                name="startDate"
                                onChange={(event) => {
                                  handlerFormChange(event, "startDate");
                                }}
                                value={formValues.startDate}
                                format="standard"
                                required={true}
                              />
                              <DateInput
                                label="End Date"
                                name="endDate"
                                onChange={(event) => {
                                  handlerFormChange(event, "endDate");
                                }}
                                value={formValues.endDate}
                                format="standard"
                                required={true}
                              />
                              <Button variant="primary" type="submit">
                                Apply
                              </Button>
                            </Flex>
                          </Form>
                        </ModalBody>
                      </Modal>
                    }
                  >
                    Rent this Car
                  </Button>
                </TableCell>
                <TableCell>
                  {vehicle.properties.available == "Yes" && (
                    <StatusTag variant="success">Available for rent</StatusTag>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Flex>
    </>
  );
};