// Google Maps service - wraps Google Maps API calls
// Note: Google Maps API calls are mostly done client-side with the JS API
// This service handles server-side distance calculations if needed

async function getDirections(origin, destination) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'your-google-maps-api-key') {
        console.warn('Google Maps API key not configured');
        return { distance: null, duration: null, error: 'API key not set' };
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.routes.length > 0) {
            const route = data.routes[0].legs[0];
            return {
                distance: route.distance.value / 1000, // km
                duration: route.duration.text,
                distanceText: route.distance.text,
                startAddress: route.start_address,
                endAddress: route.end_address
            };
        }

        return { distance: null, duration: null, error: data.status };
    } catch (err) {
        console.error('Maps API error:', err);
        return { distance: null, duration: null, error: err.message };
    }
}

module.exports = { getDirections };
