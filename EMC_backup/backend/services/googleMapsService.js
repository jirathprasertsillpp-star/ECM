const axios = require('axios');
const KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getDistance(origin, destination) {
  if (!KEY || KEY === 'your-google-maps-api-key') {
     console.log('[GoogleMaps Stub] getDistance:', origin, destination);
     // Mock 10 km
     return {
         distance_km: 10,
         distance_text: '10.0 กม.',
         duration_text: '20 นาที'
     };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
    const res = await axios.get(url, {
      params: { origins: origin, destinations: destination, key: KEY, language: 'th' }
    });

    const element = res.data.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') {
      throw new Error('ไม่สามารถคำนวณระยะทางได้');
    }

    return {
      distance_km: element.distance.value / 1000,
      distance_text: element.distance.text,
      duration_text: element.duration.text
    };
  } catch(e) {
      console.error('Google Maps API Error:', e);
      return { distance_km: 0, distance_text: 'N/A', duration_text: 'N/A' };
  }
}

async function geocode(address) {
  if (!KEY || KEY === 'your-google-maps-api-key') {
      console.log('[GoogleMaps Stub] geocode:', address);
      return { lat: 13.7563, lng: 100.5018, formatted_address: address };
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const res = await axios.get(url, { params: { address, key: KEY, language: 'th' } });

    if (res.data.status !== 'OK') throw new Error('Geocode ไม่สำเร็จ');
    const loc = res.data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng, formatted_address: res.data.results[0].formatted_address };
  } catch(e) {
      console.error('Google Maps Geocode Error:', e);
      return { lat: 0, lng: 0, formatted_address: address };
  }
}

module.exports = { getDistance, geocode };
