import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
import { handleGetStockPrice, StockQueryType } from './src/routes/stockprices/stockPriceHandler'
import cors from 'cors'

dotenv.config()

const port = process.env.PORT || 8080

const app: Express = express()

app.use(cors())

app.get('/stockPrice', async (req: { query: StockQueryType }, res) => {
  handleGetStockPrice(req, res)
})

app.get('/health', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server')
})

app.listen(port, () => {
  console.log(`Server is running at port: ${port}`)
})