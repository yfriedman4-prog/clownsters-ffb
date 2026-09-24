import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const PORT = 3001
let yahooAccessToken = process.env.YAHOO_ACCESS_TOKEN
let yahooRefreshToken = process.env.YAHOO_REFRESH_TOKEN

async function refreshYahooAccessToken() {
  const credentials = Buffer.from(
    `${process.env.YAHOO_CLIENT_ID}:${process.env.YAHOO_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch(
    'https://api.login.yahoo.com/oauth2/get_token',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        redirect_uri: process.env.YAHOO_REDIRECT_URI,
        refresh_token: yahooRefreshToken,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    console.error('Yahoo refresh error:', data)
    throw new Error('Unable to refresh Yahoo access token')
  }

  yahooAccessToken = data.access_token

  if (data.refresh_token) {
    yahooRefreshToken = data.refresh_token
  }

  console.log('Yahoo access token refreshed')

  return yahooAccessToken
}
async function yahooApiRequest(url) {
  let response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${yahooAccessToken}`,
    },
  })

  if (response.status === 401) {
    console.log('Yahoo access token expired. Refreshing...')

    const newAccessToken = await refreshYahooAccessToken()

    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
    })
  }

  if (!response.ok) {
    const errorText = await response.text()

    console.error('Yahoo API error:', errorText)

    throw new Error(
      `Yahoo API request failed with status ${response.status}`
    )
  }

  return response
}
// Basic backend test
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Clownsters FFB backend is running',
  })
})

// Start Yahoo OAuth
app.get('/api/yahoo/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.YAHOO_CLIENT_ID,
    redirect_uri: process.env.YAHOO_REDIRECT_URI,
    response_type: 'code',
  })

  const yahooAuthUrl =
    `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`

  res.redirect(yahooAuthUrl)
})

// Yahoo sends the user back here after authorization
app.get('/api/yahoo/callback', async (req, res) => {
  const { code } = req.query

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Yahoo authorization code was not received.',
    })
  }

  try {
    const credentials = Buffer.from(
      `${process.env.YAHOO_CLIENT_ID}:${process.env.YAHOO_CLIENT_SECRET}`
    ).toString('base64')

    const response = await fetch(
      'https://api.login.yahoo.com/oauth2/get_token',
      {
        method: 'POST',

        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },

        body: new URLSearchParams({
          grant_type: 'authorization_code',
          redirect_uri: process.env.YAHOO_REDIRECT_URI,
          code,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Yahoo token error:', data)

      return res.status(response.status).json({
        success: false,
        message: 'Yahoo token exchange failed.',
        error: data,
      })
    }

    console.log('Yahoo OAuth successful')

    console.log({
      expires_in: data.expires_in,
      token_type: data.token_type,
      refresh_token_received: Boolean(data.refresh_token),
    })

    res.json({
      success: true,
      message: 'Yahoo authorization successful.',
      refreshTokenReceived: Boolean(data.refresh_token),
      expiresIn: data.expires_in,
    })
  } catch (error) {
    console.error('Yahoo OAuth error:', error)

    res.status(500).json({
      success: false,
      message: 'Yahoo OAuth failed.',
    })
  }
})
app.get('/api/yahoo/games', async (req, res) => {
  try {
    const url =
      'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games?format=json'

    const response = await yahooApiRequest(url)
    const data = await response.json()

    res.json(data)
  } catch (error) {
    console.error('Yahoo games error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve Yahoo fantasy games.',
    })
  }
})
app.listen(PORT, () => {
  console.log(`Clownsters FFB server running on port ${PORT}`)
})