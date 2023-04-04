Stock Price Service Backend
===========================

This service provides a REST API for getting the historical stock prices for Apple.

Endpoints
---------

### GET /stockPrice

Returns the historical stock prices for a given stock ticker and starting date. It tries to update the latest price for today with the latest available day value.

#### Query parameters

-   `ticker` (required): The stock ticker symbol.
-   `startingFrom` (required): The starting date from which to retrieve the historical stock prices. The date format should be `yyyy-mm-dd`.

#### Response

If successful, the API returns a JSON object with the following properties:

-   `stock`: The stock ticker symbol.
-   `currency`: The currency used for the stock prices. Currently fixed to USD.
-   `timeSeries`: An array of objects representing the historical stock prices for the given stock ticker and starting date. Each object contains the following properties:
    -   `date`: The date of the stock price in `yyyy-mm-dd` format.
    -   `price`: The adjusted closing price of the stock for the given date.

If the API fails to retrieve the historical stock prices for any reason, it returns a 404 or 500 status code with an error message in the response body.

