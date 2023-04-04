import { useState, useEffect } from 'react'
import { Box, Typography, ButtonGroup, Button, CircularProgress } from '@material-ui/core'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

interface StockPriceData {
  stock: string
  currency: string
  timeSeries: {
    date: string
    price: number
  }[]
}

interface Props {
  ticker: string
}

const serverUrl = process.env.REACT_APP_SERVER_URL || "http://stockapplication2-env.eba-e3xj3spz.eu-north-1.elasticbeanstalk.com:8080" //"http://localhost:8080"

const getDateMonthsAgo = (monthsAgo: number): string => {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsAgo)
  return date.toISOString().slice(0, 10)
}

const StockPriceView: React.FC<Props> = ({ ticker }: Props) => {
  const [stockPriceData, setStockPriceData] = useState<StockPriceData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [startingFrom, setStartingFrom] = useState<string>(getDateMonthsAgo(1))

  useEffect(() => {
    if (startingFrom === '') return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${serverUrl}/stockPrice?ticker=${ticker}&startingFrom=${startingFrom}`)
        if (response.ok) {
          const data = await response.json()
          setStockPriceData(data)
        } else {
          setError('Failed to fetch data: ' + JSON.stringify(response))
        }
      } catch (error) {
        setError('Failed to fetch data: ' + JSON.stringify(error))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [ticker, startingFrom])

  const changeMonthAccuracy = (monthsAgo: number): void => {
    setStartingFrom(getDateMonthsAgo(monthsAgo))
  }

  const options: Highcharts.Options = {
    accessibility:
    {
      enabled: false
    },
    title: {
      text: `Stock Price of ${ticker}`,
    },
    xAxis: {
      categories: stockPriceData?.timeSeries.slice().reverse().map((item) => item.date),
    },
    yAxis: {
      title: {
        text: 'Price',
      },
    },
    series: [
      {
        name: 'Price',
        type: 'line',
        data: stockPriceData?.timeSeries.slice().reverse().map((item) => item.price),
      },
    ],
  }

  return (
    <Box sx={{ bgcolor: '#00000', padding: 2 }}>
      serverURL: {serverUrl}
      {error && <Typography color="error">{error}</Typography>}
      {(loading) && (
        <>
          <Typography>Loading data...</Typography>
          <CircularProgress style={{ padding: "5px", alignSelf: 'center' }} />
        </>
      )}
      {(stockPriceData) && (
        <HighchartsReact highcharts={Highcharts} options={options} data-testid="stock-price-graph" />
      )}
      {!error && stockPriceData && <ButtonGroup color="primary" aria-label="outlined primary button group">
        <Button onClick={() => changeMonthAccuracy(1)}>1 Month</Button>
        <Button onClick={() => changeMonthAccuracy(2)}>2 Months</Button>
        <Button onClick={() => changeMonthAccuracy(3)}>3 Months</Button>
      </ButtonGroup>}
    </Box>
  )
}

export default StockPriceView
