import { useEffect } from 'react'
import './App.css'
import StockPriceView from './components/StockPriceView'

function App() {
  useEffect(() => {
    document.title = "Stock price app"
 }, [])
 
  return (
    <div className="App">
      <StockPriceView ticker='AAPL'/>
    </div>
  )
}

export default App
