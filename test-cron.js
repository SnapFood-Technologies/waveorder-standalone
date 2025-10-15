require('dotenv').config({ path: '.env.local' })

async function testCron() {
  const response = await fetch('http://localhost:3000/api/cron/low-stock-alerts', {
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })
}

testCron()