import axios from 'axios'
import { path, pipe, map, filter } from 'ramda'
import SimpleCache from '../../utils/cache'

interface StockPriceRawData {
    [date: string]: {
        '1. open': string
        '2. high': string
        '3. low': string
        '4. close': string
        '5. adjusted close': string
        '6. volume': string
        '7. dividend amount': string
        '8. split coefficient': string
    }
}

interface StockPrice {
    date: string
    price: number
}

export interface StockResponse {
    stock: string
    currency: string
    timeSeries: StockPrice[]
}

export interface StockQueryType {
    ticker: string
    startingFrom: string
}

export interface TypedJsonResponse<T> extends Express.Response {
    setHeader: (arg0: string, arg1: string) => { json: (arg0: T) => void }
    status(arg0: number): { send: (arg: string) => any }
}

const stockDataApiKey = process.env.STOCK_API_KEY

// Add a cache object to store historical stock data
const stockDataCache = new SimpleCache<StockPriceRawData>({ duration: 3600000 }); // 1 hour cache duration

export const handleGetStockPrice = async (req: { query: StockQueryType }, res: TypedJsonResponse<StockResponse>): Promise<void> => {
    const ticker = req.query.ticker as string
    const startingFrom = req.query.startingFrom as string

    try {
        const data = await getStockPriceData(ticker)

        if (!data) {
            res.status(404).send(`No data received for ticker ${ticker} and startingFrom ${startingFrom}`)
            return
        }

        const timeSeriesData = parseTimeSeriesData(data, startingFrom)
        const timeSeriesWithLatestHourData = updateWithLatestPrice(await getLatestHourClosingPrice(ticker),
            timeSeriesData)

        const stockResponse: StockResponse = {
            stock: ticker,
            currency: 'USD', //NOTE: Fixed for now, future development
            timeSeries: timeSeriesWithLatestHourData,
        }

        res.setHeader('Content-Type', 'application/json').json(stockResponse)
    } catch (err) {
        console.error(err)
        res.status(500).send('Internal Server Error')
    }
}

const fetchDataFromAlphaVantage = async (
    ticker: string,
    functionType: string,
    interval?: string
): Promise<unknown | never> => {
    const intervalParam = interval ? `&interval=${interval}` : ''
    const url = `https://www.alphavantage.co/query?function=${functionType}&symbol=${ticker}${intervalParam}&apikey=${stockDataApiKey}`

    try {
        const response = await axios.get(url)
        return response.data
    } catch (error) {
        console.error(`Error fetching data for ${functionType}:`, error)
        throw error
    }
}

const parseTimeSeriesData = (data: StockPriceRawData, startingFrom: string): StockPrice[] => {
    const timeSeries = pipe(
        filter((date: string) => date >= startingFrom),
        map((date: string) => ({ date, price: parseFloat(path([date, '5. adjusted close'], data) || '0') })),
    )(Object.keys(data || {}))

    return timeSeries
}

const getStockPriceData = async (ticker: string): Promise<StockPriceRawData | null> => {
    const cachedData = stockDataCache.get(ticker)

    if (cachedData) {
        return cachedData
    } else {
        //TODO: Could zod-decode the response object to check that data format matches
        const data = await fetchDataFromAlphaVantage(ticker, 'TIME_SERIES_DAILY_ADJUSTED')
        const timeSeriesData = path<StockPriceRawData>(['Time Series (Daily)'], data)

        if (timeSeriesData) {
            stockDataCache.put(ticker, timeSeriesData)
            return timeSeriesData
        }
    }
    return null
}

const getLatestHourClosingPrice = async (ticker: string): Promise<number | null> => {
    try {
        //TODO: Could zod-decode the response object to check that data format matches
        const dayLevelData = await fetchDataFromAlphaVantage(ticker, 'TIME_SERIES_INTRADAY', '60min')
        const timeSeriesData = path(['Time Series (60min)'], dayLevelData)
        const [latestTimestamp] = Object.keys(timeSeriesData || {})
        if (latestTimestamp) {
            const latestClosingPrice = parseFloat(path([latestTimestamp, '4. close'], timeSeriesData) || '0')
            return latestClosingPrice
        }
    } catch (err) {
        console.error(err)
    }
    return null
}

const updateWithLatestPrice = (latestClosingPrice: number | null, timeSeries: StockPrice[]): StockPrice[] => {
    if (latestClosingPrice !== null) {
        const todayDate = new Date().toISOString().slice(0, 10)
        const todaysIndex = timeSeries.findIndex(stockPrice => stockPrice.date === todayDate)
        if (todaysIndex >= 0) {
            return [
                ...timeSeries.slice(0, todaysIndex),
                { ...timeSeries[todaysIndex], price: latestClosingPrice },
                ...timeSeries.slice(todaysIndex + 1),
            ]
        }
    }
    return [...timeSeries]
}
