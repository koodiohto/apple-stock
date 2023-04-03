import nock from 'nock'
import { handleGetStockPrice, StockResponse, TypedJsonResponse } from '../stockPriceHandler'

//fix the date to ease testing
const mockDate = new Date('2021-01-02T00:00:00Z')
jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

describe('When third party stock API returns error data', () => {
    let consoleErrorSpy: jest.SpyInstance
    let mockResponse: TypedJsonResponse<StockResponse>
    let statusSpy: jest.SpyInstance
    let sendSpy: jest.SpyInstance
    beforeAll(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
    })

    beforeEach(() => {
        //Prepare a mock response object
        mockResponse = {
            setHeader: (arg0: string, arg1: string) => {
                return { json: (arg0: StockResponse) => { } }
            },
            status: (arg0: number) => {
                return { send: sendSpy }
            },
        } as unknown as TypedJsonResponse<StockResponse>

        statusSpy = jest.spyOn(mockResponse, 'status')
        sendSpy = jest.fn()
    })

    afterEach(() => {
        nock.cleanAll()
        jest.clearAllMocks()
    })
    afterAll(() => {
        consoleErrorSpy.mockRestore()
    })

    it('should return a 404 status when the API does not return data', async () => {
        const ticker = 'INVALID'
        const startingFrom = '2021-01-01'
        const apiKey = process.env.STOCK_API_KEY

        // Mock daily stock data with no data
        const dailyDataNock = nock('https://www.alphavantage.co')
            .get(`/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&apikey=${apiKey}`)
            .reply(200, {})

        await handleGetStockPrice({ query: { ticker, startingFrom } }, mockResponse)

        dailyDataNock.isDone()
        expect(statusSpy).toHaveBeenCalledTimes(1)
        expect(statusSpy).toHaveBeenCalledWith(404)
        expect(sendSpy).toHaveBeenCalledTimes(1)
        expect(sendSpy).toHaveBeenCalledWith(`No data received for ticker ${ticker} and startingFrom ${startingFrom}`)
    })

    it('should return a 500 status when the API call fails', async () => {
        const ticker = 'AAPL'
        const startingFrom = '2021-01-01'
        const apiKey = process.env.STOCK_API_KEY

        // Mock daily stock data with an error
        const dailyDataNock = nock('https://www.alphavantage.co')
            .get(`/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&apikey=${apiKey}`)
            .replyWithError('Something went wrong')

        await handleGetStockPrice({ query: { ticker, startingFrom } }, mockResponse)

        dailyDataNock.isDone()
        expect(statusSpy).toHaveBeenCalledTimes(1)
        expect(statusSpy).toHaveBeenCalledWith(500)
        expect(sendSpy).toHaveBeenCalledTimes(1)
        expect(sendSpy).toHaveBeenCalledWith('Internal Server Error')
    })
})

describe('When third party stock API returns proper data', () => {

    let handleGetStockPriceSpy: jest.Mock

    beforeEach(() => {
        handleGetStockPriceSpy = jest.fn()
    })

    afterEach(() => {
        nock.cleanAll()
        jest.clearAllMocks()
    })

    it('handleGetStockPrice should return a valid stock response when the API returns data', async () => {
        const ticker = 'AAPL'
        const startingFrom = '2021-01-01'
        const apiKey = process.env.STOCK_API_KEY

        // Mock daily stock data
        const dailyDataNock = nock('https://www.alphavantage.co')
            .get(`/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&apikey=${apiKey}`)
            .reply(200, {
                'Time Series (Daily)': {
                    '2021-01-02': {
                        '1. open': '101.0',
                        '5. adjusted close': '101.0',
                    },
                    '2021-01-01': {
                        '1. open': '100.0',
                        '5. adjusted close': '100.0',
                    },
                },
            })

        // Mock hour stock data
        const hourDataNock = nock('https://www.alphavantage.co')
            .get(`/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=60min&apikey=${apiKey}`)
            .reply(200, {
                'Time Series (60min)': {
                    '2021-01-02 20:00:00': {
                        '4. close': '102.0',
                    },
                },
            })

        // Prepare a mock response object
        const mockResponse: TypedJsonResponse<StockResponse> = {
            setHeader: (arg0: string, arg1: string) => {
                return { json: (arg0: StockResponse) => handleGetStockPriceSpy(arg0) }
            },
            status: (arg0: number) => {
                return { send: (arg: string) => { } }
            },
        } as TypedJsonResponse<StockResponse>

        await handleGetStockPrice({ query: { ticker, startingFrom } }, mockResponse)

        //check that the nocks were called as expected
        dailyDataNock.isDone()
        hourDataNock.isDone()

        expect(handleGetStockPriceSpy).toHaveBeenCalledTimes(1)
        expect(handleGetStockPriceSpy).toHaveBeenCalledWith({
            stock: ticker,
            currency: 'USD',
            timeSeries: [
                { date: '2021-01-02', price: 102 },
                { date: '2021-01-01', price: 100 },
            ],
        })
    })
})

