const { BetaAnalyticsDataClient } = require('@google-analytics/data');
require('dotenv').config();

// Kredensial diambil dari Environment Variables Netlify
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n'), // Penting untuk format kunci
  },
});

exports.handler = async (event) => {
  try {
    const { urlPath } = JSON.parse(event.body);
    const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID; // ID Properti GA4 Anda

    if (!urlPath || !GA_PROPERTY_ID) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing URL path or GA Property ID' }),
      };
    }

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [{ startDate: '2020-01-01', endDate: 'today' }], // Rentang waktu: sejak 2020 hingga hari ini
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'EXACT',
            value: urlPath,
          },
        },
      },
      dimensions: [{ name: 'pagePath' }],
    });

    // Ekstrak angka page views dari respons
    let viewCount = 0;
    if (response.rows && response.rows.length > 0) {
      // Ambil nilai metrik pertama (screenPageViews)
      viewCount = parseInt(response.rows[0].metricValues[0].value, 10);
    }
    
    // Format angka (misalnya: 1,234)
    const formattedCount = viewCount.toLocaleString('id-ID'); 

    return {
      statusCode: 200,
      body: JSON.stringify({ views: formattedCount }),
    };
  } catch (error) {
    console.error('GA Data API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch view count' }),
    };
  }
};