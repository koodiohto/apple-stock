/* eslint-disable testing-library/no-wait-for-multiple-assertions */
import { render, screen, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import StockPriceView from '../../components/StockPriceView'

const AppleMockStockData = {
  stock: 'AAPL',
  currency: 'USD',
  timeSeries: [
    {
      date: '2023-03-31',
      price: 158.35,
    },
    {
      date: '2023-03-30',
      price: 155.14,
    },
    {
      date: '2023-03-29',
      price: 156.56,
    },
  ],
}

const serverUrl = process.env.REACT_APP_SERVER_URL

const server = setupServer(
  rest.get(`${serverUrl}/stockPrice`, (req, res, ctx) => {
    const searchParams = new URLSearchParams(req.url.search)
    const ticker = searchParams.get('ticker')
    if (ticker === 'AAPL') {
      return res(
        ctx.json(AppleMockStockData)
      )
    } else {
      return res(ctx.status(404))
    }
  })
)

describe('StockPriceGraph', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  test('renders loading message initially', () => {
    render(<StockPriceView ticker="AAPL" />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  test('renders error message if API request fails', async () => {
    server.use(
      rest.get('https://myapi/stockPrice', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )
    render(<StockPriceView ticker="INVALID" />)
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch data')).toBeInTheDocument()
    })
  })

  test('renders Highcharts graph with data', async () => {
    render(<StockPriceView ticker="AAPL" />)
    await waitFor(() => {
      expect(screen.getByText('Stock Price of AAPL')).toBeInTheDocument()
      expect(screen.getByText('2023-03-31')).toBeInTheDocument()
      expect(screen.getByText('2023-03-30')).toBeInTheDocument()
      expect(screen.getByText('2023-03-29')).toBeInTheDocument()
    })
  })
})
