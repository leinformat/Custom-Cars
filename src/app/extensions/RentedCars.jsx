import {
    Button,
    Flex,
    LoadingSpinner,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    hubspot,
    Text,
    StatusTag
  } from "@hubspot/ui-extensions";
  import React, { useEffect, useState } from "react";
  
  const ITEMS_PER_PAGE = 5;
  
  // Define the extension to be run within the Hubspot CRM
  hubspot.extend(({ context, runServerlessFunction, actions }) => (
      <RentedCars
        context={context}
        runServerless={runServerlessFunction}
        sendAlert={actions.addAlert}
        fetchProperties={actions.fetchCrmObjectProperties}
        actions={actions}
        refreshObjectProperties={actions.refreshObjectProperties}
      />
  ));
  
  const RentedCars = ({ context, runServerless, sendAlert,fetchProperties,actions }) => {
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
        name: "getRentedVehicles",
        parameters: { contactId: context.crm.objectId },
      }).then((dataVehicles) => {
        console.log(dataVehicles.response.results);

        const filterVehicles= dataVehicles.response.results.filter((item) => item.properties.available != 'Yes' );

        setVehicles(filterVehicles);
        setVehiclesCount(dataVehicles.response.total);
        setVehiclesFetching(false);
      })
    }
  
    useEffect(() => {
      fetchVehicles();
    }, []);
    
    // Rent Vehicle
    const cancelRent = (vehicleId) => {
    const parameters = {
        startDate: "",
        endDate: "",
        vehicleId,
        rentedBy: "",
        available: "Yes",
    };
    runServerless({
        name: "rentVehicle",
        parameters,
    }).then((response) => {
        fetchVehicles();
        sendAlert({ message: "Rent Deleted", type: "warning" });
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
          {vehicles.length ? (
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
                  <TableHeader>START DAY</TableHeader>
                  <TableHeader>END DAY</TableHeader>
                  <TableHeader>STATUS</TableHeader>
                  <TableHeader>ACTION</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehiclesOnCurrentPage.map((vehicle) => (
                  <TableRow>
                    <TableCell>{vehicle.properties.make}</TableCell>
                    <TableCell>{vehicle.properties.model}</TableCell>
                    <TableCell>
                      {vehicle.properties.current_agreement_start_date}
                    </TableCell>
                    <TableCell>
                      {vehicle.properties.current_agreement_end_date}
                    </TableCell>
                    <TableCell>
                      {vehicle.properties.available == "no" && (
                        <StatusTag variant="warning">Rented by you</StatusTag>
                      )}
                    </TableCell>
                    {/* Rent Car */}
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="xs"
                        type="button"
                        onClick={() => {
                          console.log("Someone clicked the button!");
                          cancelRent(vehicle.id);
                        }}
                      >
                        X
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Flex direction={"row"} justify={"center"} wrap={"wrap"} gap={"small"}>
              <Text>There're not rented cars</Text>
            </Flex>
          )}
        </Flex>
      </>
    );
  };