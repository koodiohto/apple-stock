# About

This is an application for displaying Apple stock price. The [backend](./apple-stock-backend/) of the application fetches the stock price from a [third party API](https://www.alphavantage.co/documentation/).

The application has a [React Frontend](./apple-stock-frontend/) that queries the backend for the stock price data.

The application is deployed to AWS-cloud with [Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/) and [CodeBuild pipeline](https://aws.amazon.com/codebuild/).

The application [runs here](http://Stockapplication2-env.eba-e3xj3spz.eu-north-1.elasticbeanstalk.com).

# Running the application locally

You should be able to start the application locally by running:

`docker compose up`

Though it needs the Alhavantage api-key defined in apple-stock-backend .env-file with STOCK_API_KEY

Then you should see the application with your browser in 'http://localhost'
