import {
  Divider,
  Flex,
  Input,
  LoadingSpinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Heading,
  hubspot
} from "@hubspot/ui-extensions";
import _ from 'lodash';
import React, { useEffect, useState } from "react";

import {CrmActionLink,CrmAssociationTable} from '@hubspot/ui-extensions/crm';

const ITEMS_PER_PAGE = 10;
// Define the extension to be run within the Hubspot CRM
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
    fetchProperties={actions.fetchCrmObjectProperties}
  />
));

const Extension = ({ context, runServerless, sendAlert, fetchProperties }) => {
  const [locations, setLocations] = useState([]);
  
  const [locationCount, setLocationCount] = useState(0);
  const [locationFetching, setLocationFetching] = useState(false);  

  const defaultZipCode = context?.properties?.postal_code || "";
  const [zipCode, setZipCode] = useState(defaultZipCode);

  const [currentPage, setCurrentPage] = useState(1); // For controlling current page
  const [numPages, setNumPages] = useState(0); // For storing the total number of pages

  // Function to change the current page
  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  // Fetch properties and set zip code on component mount
  useEffect(() => {
    fetchProperties(["postal_code"]).then(properties => {
      setZipCode(properties.postal_code || "");
      //console.log(properties);
    });
  }, [fetchProperties]); 

  // Fetch locations when zip code is set
  useEffect(() => {
    if (zipCode) {
      fetchLocations();
    }
  }, [zipCode]);

  // Whenever the locationCount or locations change, reset the paging
  useEffect(() => {
    setNumPages(Math.ceil(locationCount / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [locationCount, locations]);

  // Calculate the slice of locations for the current page
  const locationsOnCurrentPage = locations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function fetchLocations() {
    sendAlert({ message: "Fetching locations...", type: "info" });
    setLocationFetching(true);
    runServerless({ name: "getLocations", parameters: { "zipCode": zipCode } }).then((resp) => {
      setLocations(resp.response.results);
      setLocationCount(resp.response.total);
      setLocationFetching(false);
    })
  }

  const debouncedFetchLocations = _.debounce(setZipCode, 700);

  return (
    <>
    <Flex direction="column" gap="medium" align="start">
      <Flex direction="column" justify="start" gap="sm" align="start">
        <Heading>Available Cars in this Location</Heading>
        <Divider />
        <CrmAssociationTable
          objectTypeId="2-31983874"
          propertyColumns={["make", "model", "year"]}
          quickFilterProperties={["make", "model", "year"]}
          pageSize={10}
          sort={[
            {
              direction: 1,
              columnName: "make",
            },
          ]}
          searchable={false}
          pagination={true}
        />
      </Flex>

      <Flex direction="column" gap="sm" justify="start">
          <Heading>Find Other Locations</Heading>
          <Divider />
       
          <Input
            tooltip="Please Insert a term such as zip code, Address..."
            name="zipCode"
            label="Search Term"
            value={zipCode}
            onInput={(e) => debouncedFetchLocations(e)}
          />
        
        <Divider />
        <Text>{locationFetching && <LoadingSpinner />}</Text>
      
      <Table
        bordered={true}
        paginated={true}
        pageCount={numPages}
        onPageChange={(newPage) => changePage(newPage)}
      >
        <TableHead>
          <TableRow>
            <TableHeader>Zip</TableHeader>
            <TableHeader>Address</TableHeader>
            <TableHeader>Available Vehicles</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {locationsOnCurrentPage.map((location, index) => {
            return (
              <TableRow>
                <TableCell>
                  <CrmActionLink
                    actionType="PREVIEW_OBJECT"
                    actionContext={{
                      objectTypeId: "2-31983851",
                      objectId: location.id,
                    }}
                    variant="dark"
                  >
                    {location.properties.postal_code}
                  </CrmActionLink>
                </TableCell>

                <TableCell>
                  {location.properties.address_1 +
                    " " +
                    location.properties.city +
                    ", " +
                    location.properties.state}
                </TableCell>
                <TableCell>
                  {location.properties.number_of_available_vehicles}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </Flex>
      </Flex>
    </>
  );
};
