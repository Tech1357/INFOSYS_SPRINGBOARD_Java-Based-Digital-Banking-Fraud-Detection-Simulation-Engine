import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { hybridAPI, analystAPI } from '../services/api'
import { FiActivity, FiTrendingUp, FiTrendingDown, FiAlertTriangle } from 'react-icons/fi'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const Container = styled.div``

const Header = styled.div`
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.75rem;
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    svg {
      color: var(--primary);
    }
  }
  
  p {
    color: var(--text-secondary);
    font-size: 0.95rem;
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const StatCard = styled.div`
  background: var(--bg-card);
  border: 2px solid ${props => props.$color || 'var(--border-color)'};
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.$color || 'var(--primary)'};
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
`

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`

const StatIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: ${props => props.$color ? `${props.$color}20` : 'rgba(76, 110, 245, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    font-size: 1.75rem;
    color: ${props => props.$color || 'var(--primary)'};
  }
`

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`

const StatDescription = styled.div`
  font-size: 0.875rem;
  color: var(--text-tertiary);
  line-height: 1.4;
`

const ChartCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  
  h3 {
    font-size: 1.125rem;
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    svg {
      color: var(--primary);
    }
  }
`

const TrendCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  grid-column: 1 / -1;
`

const FilterBar = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`

const FilterLabel = styled.label`
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const FilterSelect = styled.select`
  padding: 0.625rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
  min-width: 150px;
  
  &:hover {
    border-color: var(--primary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(76, 110, 245, 0.1);
  }
`

const FilterInput = styled.input`
  padding: 0.625rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  transition: var(--transition);
  
  &:hover {
    border-color: var(--primary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(76, 110, 245, 0.1);
  }
`

const ApplyButton = styled.button`
  padding: 0.625rem 1.5rem;
  background: var(--primary);
  border: none;
  color: white;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  margin-top: auto;
  
  &:hover {
    background: var(--primary-dark);
    box-shadow: var(--shadow-glow);
  }
`

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalTransactions: 0,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
    approvedCount: 0,
    holdCount: 0,
    blockedCount: 0,
    autoGeneratedCount: 0
  })
  const [transactions, setTransactions] = useState([])
  const [allTransactions, setAllTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  
  // Filter states
  const [dateRange, setDateRange] = useState('today') // Default to "Today" instead of "all"
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchData = async () => {
    try {
      console.log('Fetching analytics data...')
      const analyticsRes = await hybridAPI.getAnalytics()
      console.log('Analytics response:', analyticsRes.data)
      
      // Fetch all transactions (handle pagination)
      let allTxns = []
      let page = 0
      let hasMore = true
      
      while (hasMore && page < 100) { // Safety limit: max 100 pages
        const transactionsRes = await analystAPI.getTransactions({ page, size: 100 })
        const txns = transactionsRes.data.transactions || []
        allTxns = [...allTxns, ...txns]
        
        // Check if there are more pages
        const totalPages = transactionsRes.data.totalPages || 0
        hasMore = page + 1 < totalPages
        page++
        
        console.log(`Fetched page ${page}, total so far: ${allTxns.length}`)
      }
      
      console.log(`Total transactions fetched: ${allTxns.length}`)
      setAllTransactions(allTxns)
      
      // Apply initial filter
      filterTransactions(allTxns, dateRange, startDate, endDate)
      
      setLoading(false)
      setError(null)
      setLastUpdate(new Date())
      console.log('Data loaded successfully')
    } catch (error) {
      console.error('Error fetching data:', error)
      console.error('Error details:', error.response)
      setError(error.response?.data?.message || error.message || 'Failed to load analytics')
      setLoading(false)
    }
  }

  const filterTransactions = (txns, range, start, end) => {
    let filtered = [...txns]
    const now = new Date()
    
    if (range === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      filtered = txns.filter(txn => new Date(txn.transactionTime) >= today)
    } else if (range === 'last7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = txns.filter(txn => new Date(txn.transactionTime) >= sevenDaysAgo)
    } else if (range === 'last30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filtered = txns.filter(txn => new Date(txn.transactionTime) >= thirtyDaysAgo)
    } else if (range === 'custom' && start && end) {
      const startDateTime = new Date(start)
      const endDateTime = new Date(end)
      endDateTime.setHours(23, 59, 59, 999)
      filtered = txns.filter(txn => {
        const txnDate = new Date(txn.transactionTime)
        return txnDate >= startDateTime && txnDate <= endDateTime
      })
    }
    
    setTransactions(filtered)
    
    // Recalculate analytics for filtered data
    const newAnalytics = {
      totalTransactions: filtered.length,
      lowRisk: filtered.filter(t => t.riskLevel === 'LOW').length,
      mediumRisk: filtered.filter(t => t.riskLevel === 'MEDIUM').length,
      highRisk: filtered.filter(t => t.riskLevel === 'HIGH').length,
      approvedCount: filtered.filter(t => t.status === 'APPROVED').length,
      holdCount: filtered.filter(t => t.status === 'HOLD').length,
      blockedCount: filtered.filter(t => t.status === 'BLOCKED').length,
      autoGeneratedCount: filtered.filter(t => t.source === 'AUTO_GENERATED').length
    }
    setAnalytics(newAnalytics)
  }

  const handleApplyFilter = () => {
    filterTransactions(allTransactions, dateRange, startDate, endDate)
  }

  const handleDateRangeChange = (e) => {
    const newRange = e.target.value
    setDateRange(newRange)
    if (newRange !== 'custom') {
      filterTransactions(allTransactions, newRange, startDate, endDate)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Auto-refresh interval based on filter
    let refreshInterval
    if (dateRange === 'today') {
      // Refresh every 5 seconds for "Today" to show real-time updates
      refreshInterval = setInterval(fetchData, 5000)
    } else {
      // Refresh every 30 seconds for other filters
      refreshInterval = setInterval(fetchData, 30000)
    }
    
    return () => clearInterval(refreshInterval)
  }, [dateRange]) // Re-run when dateRange changes

  const fraudRate = analytics.totalTransactions > 0 
    ? ((analytics.highRisk / analytics.totalTransactions) * 100).toFixed(1)
    : 0
  
  const approvalRate = analytics.totalTransactions > 0
    ? ((analytics.approvedCount / analytics.totalTransactions) * 100).toFixed(1)
    : 0

  // Fraud trend over time (day-by-day)
  const getFraudTrendData = () => {
    if (transactions.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Fraud Transactions',
          data: [0],
          borderColor: 'var(--danger)',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          tension: 0.4,
          fill: true
        }]
      }
    }

    // Group transactions by date
    const dateGroups = {}
    transactions.forEach(txn => {
      const date = new Date(txn.transactionTime)
      const dateKey = date.toISOString().split('T')[0]
      
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = {
          total: 0,
          fraud: 0,
          legitimate: 0
        }
      }
      
      dateGroups[dateKey].total++
      if (txn.riskLevel === 'HIGH') {
        dateGroups[dateKey].fraud++
      } else {
        dateGroups[dateKey].legitimate++
      }
    })

    // Sort dates and create arrays
    const sortedDates = Object.keys(dateGroups).sort()
    const labels = sortedDates.map(date => {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
    
    const fraudCounts = sortedDates.map(date => dateGroups[date].fraud)
    const legitimateCounts = sortedDates.map(date => dateGroups[date].legitimate)
    const totalCounts = sortedDates.map(date => dateGroups[date].total)

    return {
      labels,
      datasets: [
        {
          label: 'Fraud Transactions',
          data: fraudCounts,
          borderColor: '#ff6b6b',
          backgroundColor: 'rgba(255, 107, 107, 0.2)',
          tension: 0.4,
          fill: true,
          borderWidth: 2
        },
        {
          label: 'Legitimate Transactions',
          data: legitimateCounts,
          borderColor: '#51cf66',
          backgroundColor: 'rgba(81, 207, 102, 0.2)',
          tension: 0.4,
          fill: true,
          borderWidth: 2
        },
        {
          label: 'Total Transactions',
          data: totalCounts,
          borderColor: '#4c6ef5',
          backgroundColor: 'rgba(76, 110, 245, 0.1)',
          tension: 0.4,
          fill: false,
          borderWidth: 3,
          borderDash: [5, 5]
        }
      ]
    }
  }

  const fraudTrendData = getFraudTrendData()

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#adb5bd',
          padding: 15,
          font: { size: 12 }
        }
      }
    }
  }

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#adb5bd' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#adb5bd' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  }

  if (loading) {
    return (
      <Container>
        <Header>
          <h2><FiActivity /> Transaction Analytics</h2>
          <p>Loading analytics...</p>
        </Header>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Header>
          <h2><FiActivity /> Transaction Analytics</h2>
          <p style={{ color: 'var(--danger)' }}>Error: {error}</p>
        </Header>
        <div style={{ 
          padding: '2rem', 
          background: 'var(--bg-card)', 
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--danger)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Unable to load analytics data. Please make sure:
          </p>
          <ul style={{ 
            textAlign: 'left', 
            color: 'var(--text-secondary)', 
            maxWidth: '500px', 
            margin: '0 auto',
            lineHeight: '1.8'
          }}>
            <li>Backend server is running (port 8080)</li>
            <li>Database has transaction data</li>
            <li>Transactions are being auto-generated</li>
          </ul>
          <button 
            onClick={fetchData}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Retry
          </button>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <h2><FiActivity /> Transaction Analytics & Trends</h2>
        <p>Real-time insights from auto-generated transactions</p>
      </Header>

      <FilterBar>
        <FilterLabel>
          Date Range
          <FilterSelect value={dateRange} onChange={handleDateRangeChange}>
            <option value="all">All Time (Historical)</option>
            <option value="today">Today (Real-Time)</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </FilterSelect>
        </FilterLabel>
        
        {dateRange === 'custom' && (
          <>
            <FilterLabel>
              Start Date
              <FilterInput 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FilterLabel>
            
            <FilterLabel>
              End Date
              <FilterInput 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FilterLabel>
            
            <ApplyButton onClick={handleApplyFilter}>
              Apply Filter
            </ApplyButton>
          </>
        )}
        
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Showing {analytics.totalTransactions} transactions
          </div>
          {lastUpdate && (
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: dateRange === 'today' ? 'var(--success)' : 'var(--primary)',
                animation: dateRange === 'today' ? 'pulse 2s ease-in-out infinite' : 'none'
              }} />
              Last updated: {lastUpdate.toLocaleTimeString()}
              {dateRange === 'today' && ' (Live)'}
            </div>
          )}
        </div>
      </FilterBar>

      <StatsGrid>
        <StatCard $color="var(--primary)">
          <StatHeader>
            <div>
              <StatLabel>Total Transactions</StatLabel>
              <StatValue>{analytics.totalTransactions}</StatValue>
              <StatDescription>
                Auto-generated: {analytics.autoGeneratedCount}
              </StatDescription>
            </div>
            <StatIcon $color="var(--primary)">
              <FiActivity />
            </StatIcon>
          </StatHeader>
        </StatCard>

        <StatCard $color="var(--danger)">
          <StatHeader>
            <div>
              <StatLabel>Fraud Detection Rate</StatLabel>
              <StatValue>{fraudRate}%</StatValue>
              <StatDescription>
                {analytics.highRisk} high-risk detected
              </StatDescription>
            </div>
            <StatIcon $color="var(--danger)">
              <FiAlertTriangle />
            </StatIcon>
          </StatHeader>
        </StatCard>

        <StatCard $color="var(--success)">
          <StatHeader>
            <div>
              <StatLabel>Approval Rate</StatLabel>
              <StatValue>{approvalRate}%</StatValue>
              <StatDescription>
                {analytics.approvedCount} transactions approved
              </StatDescription>
            </div>
            <StatIcon $color="var(--success)">
              <FiTrendingUp />
            </StatIcon>
          </StatHeader>
        </StatCard>

        <StatCard $color="var(--warning)">
          <StatHeader>
            <div>
              <StatLabel>Blocked Transactions</StatLabel>
              <StatValue>{analytics.blockedCount}</StatValue>
              <StatDescription>
                Prevented fraudulent activity
              </StatDescription>
            </div>
            <StatIcon $color="var(--warning)">
              <FiTrendingDown />
            </StatIcon>
          </StatHeader>
        </StatCard>
      </StatsGrid>

      <ChartCard style={{ marginBottom: '2rem' }}>
        <h3>
          <FiTrendingUp />
          Fraud Analytics Trend Over Time
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Daily breakdown of fraud vs legitimate transactions
          {dateRange !== 'all' && ` (${dateRange === 'today' ? 'Today' : dateRange === 'last7days' ? 'Last 7 Days' : dateRange === 'last30days' ? 'Last 30 Days' : 'Custom Range'})`}
        </p>
        <Line data={fraudTrendData} options={lineOptions} />
      </ChartCard>

      <TrendCard>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          System Performance Summary
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ 
            padding: '1rem', 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--primary)'
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Detection Accuracy
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {analytics.totalTransactions > 0 
                ? ((analytics.approvedCount + analytics.blockedCount) / analytics.totalTransactions * 100).toFixed(1)
                : 0}%
            </div>
          </div>
          
          <div style={{ 
            padding: '1rem', 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--success)'
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Low Risk Transactions
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {analytics.lowRisk}
            </div>
          </div>
          
          <div style={{ 
            padding: '1rem', 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--warning)'
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Medium Risk (Review)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {analytics.mediumRisk}
            </div>
          </div>
          
          <div style={{ 
            padding: '1rem', 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--danger)'
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              High Risk (Blocked)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {analytics.highRisk}
            </div>
          </div>
        </div>
      </TrendCard>
    </Container>
  )
}

export default Analytics
