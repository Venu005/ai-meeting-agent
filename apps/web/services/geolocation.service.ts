import axios from 'axios';

interface IPGeolocationResponse {
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export class GeolocationService {
  static async getLocationFromIP(): Promise<IPGeolocationResponse> {
    try {
      const response = await axios.get<IPGeolocationResponse>('https://ipapi.co/json/', {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.warn('[GeolocationService] Failed to fetch IP geolocation:', error);
      throw error;
    }
  }
}
